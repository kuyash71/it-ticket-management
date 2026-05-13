package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;
import com.itsm.ticket.ticket.domain.policy.StatusTransitionPolicy;
import com.itsm.ticket.ticket.exception.IllegalStatusTransitionException;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("SERVICE_REQUEST")
public class ServiceRequestTicket extends Ticket {

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "request_approval_id", referencedColumnName = "id")
    private ServiceRequestApproval approval;

    public ServiceRequestTicket(String title, String description) {
        super(title, description, TicketType.SERVICE_REQUEST);
        this.approval = new ServiceRequestApproval();
    }

    public ServiceRequestTicket(String title, String description, TicketUrgency urgency) {
        super(title, description, TicketType.SERVICE_REQUEST, urgency);
        this.approval = new ServiceRequestApproval();
    }

    protected ServiceRequestTicket() {
    }

    // ── Approval state virtual dispatch (avoids Hibernate proxy instanceof issues) ──

    @Override
    public boolean isPendingApproval() {
        return approval != null && approval.getState() == ServiceRequstApprovalStatus.PENDING;
    }

    @Override
    public boolean isApproved() {
        return approval != null && approval.getState() == ServiceRequstApprovalStatus.APPROVED;
    }

    @Override
    public String getApprovalStateName() {
        return approval != null ? approval.getState().name() : null;
    }

    // ── Transition guards ──

    /**
     * Blocks agent/manager from moving IN_PROGRESS while approval is PENDING (Doc §2.4).
     * Customers are exempt — they signal "I've responded" independently of approval state.
     * Blocks WAITING_FOR_CUSTOMER transitions while PENDING too: no point requesting info
     * from the customer before the request has even been approved.
     * Manager OVERRIDE_STATUS bypasses this entirely — it calls overrideStatus() not transitionTo().
     */
    @Override
    public void transitionTo(TicketStatus target, TicketRole actor, StatusTransitionPolicy policy) {
        if (isPendingApproval() && actor != TicketRole.CUSTOMER) {
            if (target == TicketStatus.IN_PROGRESS || target == TicketStatus.WAITING_FOR_CUSTOMER) {
                throw new IllegalStatusTransitionException(getStatus(), target, actor);
            }
        }
        super.transitionTo(target, actor, policy);
    }

    /**
     * Blocks take-ownership while approval is PENDING (Doc §2.4).
     * An agent may only start working after the manager has approved.
     */
    @Override
    public void takeOwnership(TicketRole actor, String agentUsername, StatusTransitionPolicy policy) {
        if (isPendingApproval()) {
            throw new IllegalStateException(
                    "Service request must be approved by a manager before it can be taken into progress");
        }
        super.takeOwnership(actor, agentUsername, policy);
    }

    /**
     * Resolution requires APPROVED state (Doc §2.4):
     * "Approval tamamlanmadan RESOLVED durumuna geçilemez".
     */
    @Override
    public void resolve(TicketRole actor, String note,
                        com.itsm.ticket.ticket.domain.enums.ResolutionCode code,
                        StatusTransitionPolicy policy) {
        if (!isApproved()) {
            throw new IllegalStatusTransitionException(getStatus(), TicketStatus.RESOLVED, actor);
        }
        super.resolve(actor, note, code, policy);
    }

    public ServiceRequestApproval getApproval() {
        return approval;
    }
}
