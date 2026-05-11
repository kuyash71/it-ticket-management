package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.*;
import com.itsm.ticket.ticket.domain.policy.*;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "TicketType", discriminatorType = DiscriminatorType.STRING)
public class Ticket {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketImpact impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketUrgency urgency;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "sla_clock_id", referencedColumnName = "id")
    private SLAClock slaClock;

    @Version
    @Column(nullable = false)
    private Long version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketType type;

    private String processInstanceId;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TicketEvent> events = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AuditRecord> auditRecords = new ArrayList<>();

    protected Ticket() {}

    public Ticket(String title, String description, TicketType type) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.status = TicketStatus.NEW;
        this.urgency = TicketUrgency.LOW;
        this.impact = TicketImpact.LOW;
        this.type = type;
        applyPriority(new TicketPriorityTransition());
        this.slaClock = new SLAClock();
        this.slaClock.setDeadline(new SLADeadlineService().calculate(this.type, this.priority));
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void applyPriority(PriorityTransitionPolicy policy) {
        this.priority = policy.calculate(this.impact, this.urgency);
    }

    public void transitionTo(TicketStatus target, TicketRole actor, StatusTransitionPolicy policy) {
        policy.validateTicket(this.status, target, actor);
        switch (target) {
            case IN_PROGRESS -> this.slaClock.resume();
            case RESOLVED -> this.slaClock.stop();
            case WAITING_FOR_CUSTOMER -> this.slaClock.pause();
        }
        this.status = target;
    }

    public TicketEvent addComment(String actorId, String body,
                                  TicketEventVisibility visibility, UUID parentId) {
        if (parentId != null) {
            TicketEvent parent = events.stream()
                    .filter(e -> e.getId().equals(parentId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Parent comment not found: " + parentId));
            if (parent.getEventType() != TicketEventType.COMMENT) {
                throw new IllegalArgumentException("Can only reply to COMMENT type events");
            }
        }
        TicketEvent event = TicketEvent.comment(this, actorId, body, visibility, parentId);
        events.add(event);
        return event;
    }

    public TicketEvent addWorklog(String actorId, String body, TicketEventVisibility visibility) {
        TicketEvent event = TicketEvent.worklog(this, actorId, body, visibility);
        events.add(event);
        return event;
    }

    public TicketEvent recordSystemEvent(String actorId, String payload) {
        TicketEvent event = TicketEvent.systemEvent(this, actorId, payload);
        events.add(event);
        return event;
    }

    public Attachment attach(String fileName, String mimeType, long sizeBytes,
                             String storageKey, TicketEventVisibility visibility, String uploadedBy) {
        new AttachmentPolicy().validate(mimeType, sizeBytes);
        Attachment attachment = Attachment.of(this, fileName, mimeType, sizeBytes,
                storageKey, visibility, uploadedBy);
        attachments.add(attachment);
        return attachment;
    }

    public AuditRecord audit(String actorId, CatalogEventType action,
                             String reason, String detail) {
        AuditRecord record = AuditRecord.of(this, actorId, action, reason, detail);
        auditRecords.add(record);
        return record;
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public TicketStatus getStatus() { return status; }
    public TicketPriority getPriority() { return priority; }
    public TicketImpact getImpact() { return impact; }
    public TicketUrgency getUrgency() { return urgency; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public SLAClock getSlaClock() { return slaClock; }
    public TicketType getType() { return type; }
    public List<TicketEvent> getEvents() { return Collections.unmodifiableList(events); }
    public List<Attachment> getAttachments() { return Collections.unmodifiableList(attachments); }
    public List<AuditRecord> getAuditRecords() { return Collections.unmodifiableList(auditRecords); }

    protected void setStatus(TicketStatus status) { this.status = status; }

    public void setProcessInstanceId(String processInstanceId) {
        this.processInstanceId = processInstanceId;
    }

    public void setImpact(TicketImpact impact) {
        this.impact = impact;
        applyPriority(new TicketPriorityTransition());
    }

    public void setUrgency(TicketUrgency urgency) {
        this.urgency = urgency;
        applyPriority(new TicketPriorityTransition());
    }
}
