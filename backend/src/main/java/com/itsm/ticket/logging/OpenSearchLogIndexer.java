package com.itsm.ticket.logging;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/** Indexes {@link LogEvent}s asynchronously into the configured OpenSearch index. */
@Service
public class OpenSearchLogIndexer {

    private static final Logger log = LoggerFactory.getLogger(OpenSearchLogIndexer.class);

    // Dedicated pool so OpenSearch I/O never blocks request threads.
    private static final Executor INDEXER_POOL = Executors.newFixedThreadPool(2,
            r -> new Thread(r, "opensearch-indexer"));

    private final OpenSearchClient openSearchClient;
    private final String indexName;

    public OpenSearchLogIndexer(OpenSearchClient openSearchClient,
                                @Value("${observability.opensearch.index}") String indexName) {
        this.openSearchClient = openSearchClient;
        this.indexName = indexName;
    }

    /**
     * Non-blocking: schedules indexing on a dedicated thread pool.
     * traceId is passed explicitly because MDC is thread-local and unavailable in the pool thread.
     */
    public void indexAsync(String eventType, String ticketId, String actor,
                           String traceId, Map<String, String> payload) {
        CompletableFuture.runAsync(
                () -> doIndex(eventType, ticketId, actor, traceId, payload),
                INDEXER_POOL
        );
    }

    private void doIndex(String eventType, String ticketId, String actor,
                         String traceId, Map<String, String> payload) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("eventType", eventType);
        document.put("timestamp", Instant.now().toString());
        document.put("traceId", traceId != null ? traceId : "");
        document.put("ticketId", ticketId != null ? ticketId : "");
        document.put("actor", actor != null ? actor : "");
        document.put("payload", payload);

        try {
            openSearchClient.index(i -> i.index(indexName).document(document));
            log.debug("OpenSearch log indexed eventType={} ticketId={}", eventType, ticketId);
        } catch (IOException ex) {
            log.error("OpenSearch indexing failed eventType={} ticketId={}", eventType, ticketId, ex);
        }
    }
}
