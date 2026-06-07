package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.TicketEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_events")
public class TicketEvent {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketEventVisibility visibility;

    @Column(nullable = false)
    private String actorId;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private UUID parentId;

    @Column(nullable = false)
    private Instant occurredAt;

    protected TicketEvent() {}

    static TicketEvent comment(Ticket ticket, String actorId, String body,
                               TicketEventVisibility visibility, UUID parentId) {
        TicketEvent e = new TicketEvent();
        e.id = UUID.randomUUID();
        e.ticket = ticket;
        e.eventType = TicketEventType.COMMENT;
        e.actorId = actorId;
        e.body = body;
        e.visibility = visibility;
        e.parentId = parentId;
        e.occurredAt = Instant.now();
        return e;
    }

    static TicketEvent worklog(Ticket ticket, String actorId, String body,
                               TicketEventVisibility visibility) {
        TicketEvent e = new TicketEvent();
        e.id = UUID.randomUUID();
        e.ticket = ticket;
        e.eventType = TicketEventType.WORKLOG;
        e.actorId = actorId;
        e.body = body;
        e.visibility = visibility;
        e.occurredAt = Instant.now();
        return e;
    }

    static TicketEvent complaint(Ticket ticket, String actorId, String body) {
        TicketEvent e = new TicketEvent();
        e.id = UUID.randomUUID();
        e.ticket = ticket;
        e.eventType = TicketEventType.SERVICE_QUALITY_COMPLAINT;
        e.actorId = actorId;
        e.body = body;
        // EXTERNAL: customer kendi şikayetini de timeline'da görür (kayıt aldığını teyit eder).
        // Manager'a yönelik proaktif bilgilendirme NotificationService üzerinden ayrıca tetiklenir.
        e.visibility = TicketEventVisibility.EXTERNAL;
        e.occurredAt = Instant.now();
        return e;
    }

    static TicketEvent systemEvent(Ticket ticket, String actorId, String payload) {
        TicketEvent e = new TicketEvent();
        e.id = UUID.randomUUID();
        e.ticket = ticket;
        e.eventType = TicketEventType.SYSTEM_EVENT;
        e.actorId = actorId;
        e.visibility = TicketEventVisibility.EXTERNAL;
        e.payload = payload;
        e.occurredAt = Instant.now();
        return e;
    }

    public UUID getId() { return id; }
    public TicketEventType getEventType() { return eventType; }
    public TicketEventVisibility getVisibility() { return visibility; }
    public String getActorId() { return actorId; }
    public String getBody() { return body; }
    public String getPayload() { return payload; }
    public UUID getParentId() { return parentId; }
    public Instant getOccurredAt() { return occurredAt; }
    public UUID getTicketId() { return ticket.getId(); }
}
