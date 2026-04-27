package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.*;
import com.itsm.ticket.ticket.domain.policy.SLADeadlineService;
import com.itsm.ticket.ticket.domain.policy.TicketPriorityTransition;
import com.itsm.ticket.ticket.domain.policy.PriorityTransitionPolicy;
import com.itsm.ticket.ticket.domain.policy.StatusTransitionPolicy;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(
    name="TicketType",
    discriminatorType = DiscriminatorType.STRING
)

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
    @JoinColumn(name = "sla_clock_id", referencedColumnName="id")
    private SLAClock slaClock;

    @Version
    @Column(nullable = false)
    private Long version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketType type;

    @Column(nullable = false)
    private Long processInstanceId;

    protected Ticket() {
        // JPA
    }

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
        this.status=target;
    }

    // SETTER - GETTER


    protected void setStatus(TicketStatus status) {
        this.status = status;
    }

    public void setProcessInstanceId(Long processInstanceId) {this.processInstanceId = processInstanceId;}

    public SLAClock getSlaClock() {
        return slaClock;
    }

    public UUID getId() {return id;}

    public TicketImpact getImpact() {return impact;}

    public void setImpact(TicketImpact impact) {
        this.impact = impact;
        applyPriority(new TicketPriorityTransition());

    }

    public TicketUrgency getUrgency() {return urgency;}

    public void setUrgency(TicketUrgency urgency) {
        this.urgency = urgency;
        applyPriority(new TicketPriorityTransition());
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
