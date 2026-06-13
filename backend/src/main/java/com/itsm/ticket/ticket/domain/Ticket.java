package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.*;
import com.itsm.ticket.ticket.domain.policy.*;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate root for the ticket lifecycle (Doc §4). Owns its timeline events, attachments,
 * audit records, and SLA clock. Subclassed by {@link IncidentTicket} and
 * {@link ServiceRequestTicket} via JOINED inheritance.
 *
 * <p>State transitions go through {@link #transitionTo}, {@link #resolve},
 * {@link #confirmClose}, {@link #forceClose}, or {@link #overrideStatus}; each enforces
 * role and policy invariants and writes an audit + system event.
 *
 * <p>Concurrent updates are protected by {@link #version} (JPA optimistic locking) —
 * a conflicting modify raises {@code ObjectOptimisticLockingFailureException} which the
 * controller layer maps to HTTP 409.
 */
@Entity
@Table(name = "tickets")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "ticket_type", discriminatorType = DiscriminatorType.STRING)
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

    private Instant resolvedAt;

    private Instant closedAt;

    @Column(columnDefinition = "TEXT")
    private String resolutionNote;

    @Enumerated(EnumType.STRING)
    @Column
    private com.itsm.ticket.ticket.domain.enums.ResolutionCode resolutionCode;

    @Column(columnDefinition = "TEXT")
    private String closeReason;

    /** Username of whoever opened this ticket (set at creation, never changes). */
    @Column
    private String reporterId;

    /** Username of the currently assigned agent (Doc §11 TAKE_OWNERSHIP/REASSIGN). */
    @Column
    private String assigneeId;

    /**
     * Highest SLA escalation level observed for this ticket (NORMAL→WARNING→RISK→BREACH).
     * Used by the scheduler to avoid emitting the same SLABreachRisk/SLABreached event twice.
     */
    @Enumerated(EnumType.STRING)
    @Column
    private com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel slaLevel
            = com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel.NORMAL;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "sla_clock_id", referencedColumnName = "id")
    private SLAClock slaClock;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketType type;

    private String processInstanceId;

    /**
     * Doc §4.2 Abandoned-case bookkeeping — WAITING_FOR_CUSTOMER state'inden çıkıldığında
     * her ikisi de null'lanır; scheduler aynı ticket'a iki kez reminder/flag göndermesin diye.
     */
    private Instant reminderSentAt;
    private Instant abandonedFlaggedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TicketEvent> events = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AuditRecord> auditRecords = new ArrayList<>();

    protected Ticket() {}

    public Ticket(String title, String description, TicketType type) {
        this(title, description, type, TicketUrgency.LOW);
    }

    public Ticket(String title, String description, TicketType type, TicketUrgency urgency) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.status = TicketStatus.NEW;
        this.urgency = urgency != null ? urgency : TicketUrgency.LOW;
        this.impact = TicketImpact.LOW;
        this.type = type;
        applyPriority(new TicketPriorityTransition());
        this.slaClock = new SLAClock();
        this.slaClock.setDeadline(new SLADeadlineService().calculate(this.type, this.priority));
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
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
        // Verifikasyon gerektiren transition'lar dedicated metodlardan gitmeli.
        // Doc §4.1: RESOLVED requires resolution note; CLOSED requires customer confirm or manager force-close + reason.
        if (target == TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("RESOLVED transition requires resolutionNote — use resolve()");
        }
        if (target == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("CLOSED transition requires actor verification — use confirmClose()/forceClose()");
        }
        policy.validateTicket(this.status, target, actor);
        switch (target) {
            case IN_PROGRESS -> this.slaClock.resume();
            case WAITING_FOR_CUSTOMER -> this.slaClock.pause();
        }
        // WAITING_FOR_CUSTOMER'dan çıkış: scheduler tarafından konan abandoned bayraklarını temizle.
        if (this.status == TicketStatus.WAITING_FOR_CUSTOMER && target != TicketStatus.WAITING_FOR_CUSTOMER) {
            this.reminderSentAt = null;
            this.abandonedFlaggedAt = null;
        }
        this.status = target;
    }

    /** Doc §4.2 — scheduler reminder/flagged timestamp'ı set eder. */
    public void markReminderSent() { this.reminderSentAt = Instant.now(); }
    public void markAbandonedFlagged() { this.abandonedFlaggedAt = Instant.now(); }
    public Instant getReminderSentAt() { return reminderSentAt; }
    public Instant getAbandonedFlaggedAt() { return abandonedFlaggedAt; }

    /**
     * RESOLVED transition with mandatory resolution note (Doc §4.1).
     * Audit + system event are produced by the service layer.
     */
    public void resolve(TicketRole actor, String note,
                        com.itsm.ticket.ticket.domain.enums.ResolutionCode code,
                        StatusTransitionPolicy policy) {
        if (note == null || note.isBlank()) {
            throw new IllegalArgumentException("Resolution note is required to resolve a ticket");
        }
        if (code == null) {
            throw new IllegalArgumentException("Resolution code is required to resolve a ticket");
        }
        policy.validateTicket(this.status, TicketStatus.RESOLVED, actor);
        this.slaClock.stop();
        this.status = TicketStatus.RESOLVED;
        this.resolutionNote = note.trim();
        this.resolutionCode = code;
        this.resolvedAt = Instant.now();
    }

    /**
     * Customer confirms closure (Doc §4.1 'Customer confirms OR timeout').
     * Only valid from RESOLVED; only CUSTOMER role.
     */
    public void confirmClose(TicketRole actor, StatusTransitionPolicy policy) {
        if (actor != TicketRole.CUSTOMER) {
            throw new IllegalArgumentException("Only the customer can confirm closure");
        }
        if (this.status != TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("Closure can only be confirmed from RESOLVED status");
        }
        policy.validateTicket(this.status, TicketStatus.CLOSED, actor);
        this.status = TicketStatus.CLOSED;
        this.closedAt = Instant.now();
        this.closeReason = "Customer confirmed";
    }

    /**
     * Manager-only status override (Doc §5.4.3 "Any → IN_PROGRESS by Manager: kritik risk
     * durumunda müdahale; gerekçe zorunludur"). Bypasses the transition policy entirely —
     * reason+audit are mandatory and produced by the service layer.
     */
    public void overrideStatus(TicketRole actor, TicketStatus target, String reason) {
        if (actor != TicketRole.MANAGER) {
            throw new IllegalArgumentException("Only managers can override the ticket status");
        }
        if (target == null) {
            throw new IllegalArgumentException("Target status is required");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Override requires a reason");
        }
        if (this.status == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot override a closed ticket — use a new ticket instead");
        }
        if (this.status == target) {
            throw new IllegalArgumentException("Ticket is already in the requested status");
        }
        // SLA clock follows the new state.
        switch (target) {
            case IN_PROGRESS -> this.slaClock.resume();
            case WAITING_FOR_CUSTOMER -> this.slaClock.pause();
            case RESOLVED, CLOSED -> this.slaClock.stop();
            default -> { /* NEW: no clock change */ }
        }
        if (target == TicketStatus.CLOSED) {
            this.closedAt = Instant.now();
            this.closeReason = reason.trim();
        }
        if (target == TicketStatus.RESOLVED && this.resolutionNote == null) {
            // Override into RESOLVED still requires a note — borrow the override reason.
            this.resolutionNote = reason.trim();
            this.resolvedAt = Instant.now();
        }
        this.status = target;
    }

    /**
     * Manager force-close with reason (Doc §9 'Manager override: reason + audit zorunlu').
     * Allowed from any non-CLOSED status.
     */
    public void forceClose(TicketRole actor, String reason) {
        if (actor != TicketRole.MANAGER) {
            throw new IllegalArgumentException("Only managers can force-close tickets");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Force-close requires a reason");
        }
        if (this.status == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Ticket is already closed");
        }
        this.slaClock.stop();
        this.status = TicketStatus.CLOSED;
        this.closedAt = Instant.now();
        this.closeReason = reason.trim();
    }

    /**
     * Agent (or manager) self-assigns a NEW ticket (Doc §11 TAKE_OWNERSHIP).
     * Transitions NEW → IN_PROGRESS atomically and sets the assignee.
     */
    public void takeOwnership(TicketRole actor, String agentUsername, StatusTransitionPolicy policy) {
        if (actor != TicketRole.AGENT && actor != TicketRole.MANAGER) {
            throw new IllegalArgumentException("Only agents and managers can take ownership of a ticket");
        }
        if (agentUsername == null || agentUsername.isBlank()) {
            throw new IllegalArgumentException("Assignee username is required");
        }
        if (this.status != TicketStatus.NEW && this.status != TicketStatus.WAITING_FOR_CUSTOMER) {
            throw new IllegalArgumentException("Ownership can only be taken from NEW or WAITING_FOR_CUSTOMER status");
        }
        // For NEW tickets, also flip status to IN_PROGRESS.
        if (this.status == TicketStatus.NEW) {
            policy.validateTicket(this.status, TicketStatus.IN_PROGRESS, actor);
            this.slaClock.resume();
            this.status = TicketStatus.IN_PROGRESS;
        }
        this.assigneeId = agentUsername.trim();
    }

    /**
     * Manager reassigns the ticket to another agent with a mandatory reason (Doc §9).
     */
    public String reassign(TicketRole actor, String newAssignee, String reason) {
        if (actor != TicketRole.MANAGER) {
            throw new IllegalArgumentException("Only managers can reassign a ticket");
        }
        if (newAssignee == null || newAssignee.isBlank()) {
            throw new IllegalArgumentException("New assignee is required");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reassign requires a reason");
        }
        if (this.status == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot reassign a closed ticket");
        }
        String previous = this.assigneeId;
        this.assigneeId = newAssignee.trim();
        return previous;
    }

    /**
     * Change priority via impact/urgency, with reason (Doc §3.2 'audit zorunlu').
     * Returns the previous priority for the service layer to audit.
     */
    public TicketPriority changePriority(TicketImpact newImpact, TicketUrgency newUrgency,
                                         String reason, TicketRole actor) {
        if (actor == TicketRole.CUSTOMER) {
            throw new IllegalArgumentException("Customers cannot change priority directly");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Priority change requires a reason");
        }
        if (this.status == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot change priority on a closed ticket");
        }
        TicketPriority previous = this.priority;
        if (newImpact != null) this.impact = newImpact;
        if (newUrgency != null) this.urgency = newUrgency;
        applyPriority(new TicketPriorityTransition());
        return previous;
    }

    public TicketEvent addComment(String actorId, String body,
                                  TicketEventVisibility visibility, UUID parentId) {
        if (parentId != null) {
            TicketEvent parent = events.stream()
                    .filter(e -> e.getId().equals(parentId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Invalid parent comment"));
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

    /**
     * Doc §7.8 — Customer files a service-quality complaint. Stored as INTERNAL so it surfaces
     * on agent/manager timelines but isn't echoed back to the customer view. Body is mandatory.
     */
    public TicketEvent addComplaint(String actorId, String body) {
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Complaint body is required");
        }
        TicketEvent event = TicketEvent.complaint(this, actorId, body.trim());
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
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getClosedAt() { return closedAt; }
    public String getResolutionNote() { return resolutionNote; }
    public com.itsm.ticket.ticket.domain.enums.ResolutionCode getResolutionCode() { return resolutionCode; }
    public String getCloseReason() { return closeReason; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public String getAssigneeId() { return assigneeId; }

    /**
     * Total elapsed seconds for SLA purposes, including time currently running since the last resume.
     * SLA-stopped tickets return the persisted elapsed value as-is.
     */
    public long currentElapsedSeconds() {
        if (slaClock == null) return 0;
        long base = slaClock.getElapsed();
        if (slaClock.getState() == com.itsm.ticket.ticket.domain.enums.SLAClockState.RUNNING
                && slaClock.getStartedAt() != null) {
            base += java.time.Duration.between(slaClock.getStartedAt(), Instant.now()).getSeconds();
        }
        return Math.max(base, 0);
    }
    public com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel getSlaLevel() { return slaLevel; }
    public void setSlaLevel(com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel level) {
        this.slaLevel = level;
    }
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

    /** Returns true only for SERVICE_REQUEST tickets whose approval is still PENDING. */
    public boolean isPendingApproval() { return false; }

    /** Returns true when no approval is required OR approval has been granted. */
    public boolean isApproved() { return true; }

    /** Returns the approval state name (PENDING/APPROVED/REJECTED) or null for incidents. */
    public String getApprovalStateName() { return null; }
}
