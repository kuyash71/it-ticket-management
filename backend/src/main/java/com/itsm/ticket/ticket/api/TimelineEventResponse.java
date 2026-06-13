package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.TicketEvent;

import java.time.Instant;
import java.util.UUID;

/** Wire-format projection of TicketEvent. */
public record TimelineEventResponse(
        UUID id,
        String eventType,
        String visibility,
        String actorId,
        String body,
        String payload,
        UUID parentId,
        Instant occurredAt
) {
    public static TimelineEventResponse from(TicketEvent event) {
        return new TimelineEventResponse(
                event.getId(),
                event.getEventType().name(),
                event.getVisibility().name(),
                event.getActorId(),
                event.getBody(),
                event.getPayload(),
                event.getParentId(),
                event.getOccurredAt()
        );
    }
}
