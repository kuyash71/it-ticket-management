package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
public class ServiceRequestApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    private UUID decidedByID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceRequstApprovalStatus state;

    private Instant decidedAt;

    @Column(nullable = true)
    private String reason;

    public ServiceRequestApproval() {
        this.state = ServiceRequstApprovalStatus.PENDING;
    }

    public void approve(UUID approvedBy) {
        this.state = ServiceRequstApprovalStatus.APPROVED;
        this.decidedAt = Instant.now();
        this.decidedByID = approvedBy;
    }
    public void reject(UUID rejectedBy, String reason) {
        this.state = ServiceRequstApprovalStatus.REJECTED;
        this.decidedAt = Instant.now();
        this.reason = reason;
        this.decidedByID = rejectedBy;
    }

    public ServiceRequstApprovalStatus getState() {
        return state;
    }

}
