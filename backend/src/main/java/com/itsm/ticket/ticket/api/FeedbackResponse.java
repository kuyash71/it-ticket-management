package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.TicketFeedback;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(
        UUID ticketId,
        String customerId,
        String agentId,
        int rating,
        String comment,
        Instant submittedAt
) {
    public static FeedbackResponse from(TicketFeedback f) {
        return new FeedbackResponse(
                f.getTicketId(), f.getCustomerId(), f.getAgentId(),
                f.getRating(), f.getComment(), f.getSubmittedAt()
        );
    }
}
