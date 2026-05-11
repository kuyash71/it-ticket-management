package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_records")
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
