package com.itsm.ticket.ticket.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Doc §4.4.6 — Customer feedback collected after a ticket is closed. One feedback per ticket.
 *
 * <p>The agent recorded here is the assignee at the time of submission, captured immutably so
 * later reassignments do not retroactively change which agent the rating belongs to.
 */
@Entity
@Table(name = "ticket_feedback")
public class TicketFeedback {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "ticket_id", nullable = false, updatable = false, unique = true)
    private UUID ticketId;

    @Column(name = "customer_id", nullable = false, updatable = false)
    private String customerId;

    /** Snapshot of the assignee at submission time; null if the ticket was never assigned. */
    @Column(name = "agent_id", updatable = false)
    private String agentId;

    @Column(nullable = false, updatable = false)
    private short rating;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String comment;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    protected TicketFeedback() {}

    public static TicketFeedback of(UUID ticketId, String customerId, String agentId,
                                    int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        TicketFeedback f = new TicketFeedback();
        f.id = UUID.randomUUID();
        f.ticketId = ticketId;
        f.customerId = customerId;
        f.agentId = agentId;
        f.rating = (short) rating;
        f.comment = comment == null ? null : comment.trim();
        f.submittedAt = Instant.now();
        return f;
    }

    public UUID getId() { return id; }
    public UUID getTicketId() { return ticketId; }
    public String getCustomerId() { return customerId; }
    public String getAgentId() { return agentId; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public Instant getSubmittedAt() { return submittedAt; }
}
