package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;

import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit log for security and compliance (Doc §11). Every state-changing
 * domain operation writes one record with actor, action, reason and JSON payload.
 */
@Entity
@Table(name = "audit_records")
@Check(name = "audit_records_action_check", constraints = "action IN (" +
        "'TICKET_CREATED','TICKET_UPDATED','STATUS_CHANGED','PRIORITY_CHANGED'," +
        "'SLA_PAUSED','SLA_RESUMED','SLA_BREACH_RISK','SLA_BREACHED'," +
        "'MANAGER_OVERRIDE','ATTACHMENT_ADDED','COMMENT_ADDED','WORKLOG_ADDED'," +
        "'ASSIGNMENT_CHANGED','APPROVAL_CHANGED')")
public class AuditRecord {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CatalogEventType action;

    @Column(nullable = false)
    private String actorId;

    private String reason;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(nullable = false)
    private Instant occurredAt;

    protected AuditRecord() {}

    static AuditRecord of(Ticket ticket, String actorId, CatalogEventType action,
                          String reason, String detail) {
        if (action == CatalogEventType.MANAGER_OVERRIDE && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("Reason is required for MANAGER_OVERRIDE audit records");
        }
        AuditRecord r = new AuditRecord();
        r.id = UUID.randomUUID();
        r.ticket = ticket;
        r.actorId = actorId;
        r.action = action;
        r.reason = reason;
        r.detail = detail;
        r.occurredAt = Instant.now();
        return r;
    }

    public UUID getId() { return id; }
    public CatalogEventType getAction() { return action; }
    public String getActorId() { return actorId; }
    public String getReason() { return reason; }
    public String getDetail() { return detail; }
    public Instant getOccurredAt() { return occurredAt; }
    public UUID getTicketId() { return ticket.getId(); }
}
