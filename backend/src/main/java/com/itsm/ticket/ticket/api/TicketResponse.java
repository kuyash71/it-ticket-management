package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.Ticket;

import java.time.Instant;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        String type,
        String title,
        String description,
        String status,
        String priority,
        Instant createdAt,
        Instant updatedAt
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getType().name(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus().name(),
                ticket.getPriority().name(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}
