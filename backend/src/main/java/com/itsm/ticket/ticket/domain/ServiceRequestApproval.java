package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
public class ServiceRequestApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @Column(length = 255)
    private String decidedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceRequstApprovalStatus state;

    private Instant decidedAt;

    @Column(nullable = true)
    private String reason;

    public ServiceRequestApproval() {
        this.state = ServiceRequstApprovalStatus.PENDING;
    }

    public void approve(String approvedBy) {
        this.state = ServiceRequstApprovalStatus.APPROVED;
        this.decidedAt = Instant.now();
        this.decidedBy = approvedBy;
    }

    public void reject(String rejectedBy, String reason) {
        this.state = ServiceRequstApprovalStatus.REJECTED;
        this.decidedAt = Instant.now();
        this.reason = reason;
        this.decidedBy = rejectedBy;
    }

    public ServiceRequstApprovalStatus getState() {
        return state;
    }

}
