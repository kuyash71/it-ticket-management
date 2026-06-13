package com.itsm.ticket.logging;

import java.util.Map;

/** Structured payload published to Kafka and indexed in OpenSearch. */
public record LogEvent(
        String eventType,
        String ticketId,
        String actor,
        Map<String, String> payload
) {
    public static LogEvent of(String eventType, String ticketId, String actor, Map<String, String> payload) {
        return new LogEvent(eventType, ticketId, actor, payload);
    }
}
