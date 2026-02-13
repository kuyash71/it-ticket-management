package com.itsm.ticket.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

    public void publish(String eventType, Map<String, Object> payload) {
        Map<String, Object> envelope = Map.of(
                "eventType", eventType,
                "timestamp", Instant.now().toString(),
                "payload", payload
        );

        kafkaTemplate.send(TOPIC, envelope);
        openSearchLogIndexer.index(eventType, payload);
        log.info("Kafka log event published: {}", envelope);
    }
}
