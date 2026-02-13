package com.itsm.ticket.logging;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Service
public class OpenSearchLogIndexer {

    private static final Logger log = LoggerFactory.getLogger(OpenSearchLogIndexer.class);

    private final OpenSearchClient openSearchClient;
    private final String indexName;

    public OpenSearchLogIndexer(OpenSearchClient openSearchClient,
                                @Value("${observability.opensearch.index}") String indexName) {
        this.openSearchClient = openSearchClient;
        this.indexName = indexName;
    }

    public void index(String eventType, Map<String, Object> payload) {
        Map<String, Object> document = Map.of(
                "eventType", eventType,
                "timestamp", Instant.now().toString(),
                "payload", payload
        );

        try {
            openSearchClient.index(i -> i.index(indexName).document(document));
            log.debug("OpenSearch log indexed: {}", document);
        } catch (IOException ex) {
            log.warn("OpenSearch indexing failed for event={}", eventType, ex);
        }
    }
}
