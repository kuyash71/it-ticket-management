package com.itsm.ticket.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class KafkaLogProducer {

    private static final Logger log = LoggerFactory.getLogger(KafkaLogProducer.class);
    private static final String TOPIC = "itsm.logs";

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final OpenSearchLogIndexer openSearchLogIndexer;

    public KafkaLogProducer(KafkaTemplate<String, Object> kafkaTemplate,
                            OpenSearchLogIndexer openSearchLogIndexer) {
        this.kafkaTemplate = kafkaTemplate;
        this.openSearchLogIndexer = openSearchLogIndexer;
    }

    public void publish(LogEvent event) {
        // Capture MDC values in the request thread before any async handoff.
        String traceId = MDC.get("traceId") != null ? MDC.get("traceId") : "";

        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventType", event.eventType());
        envelope.put("timestamp", Instant.now().toString());
        envelope.put("traceId", traceId);
        envelope.put("ticketId", event.ticketId() != null ? event.ticketId() : "");
        envelope.put("actor", event.actor() != null ? event.actor() : "");
        envelope.put("payload", event.payload());

        kafkaTemplate.send(TOPIC, event.ticketId(), envelope)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish log event to Kafka eventType={} ticketId={}",
                                event.eventType(), event.ticketId(), ex);
                    }
                });

        // Pass captured traceId explicitly so the async indexer thread doesn't touch MDC.
        openSearchLogIndexer.indexAsync(event.eventType(), event.ticketId(), event.actor(),
                traceId, event.payload());

        log.info("Log event dispatched eventType={} ticketId={} actor={}",
                event.eventType(), event.ticketId(), event.actor());
    }
}
