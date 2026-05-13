package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.domain.enums.TicketType;
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

    public ServiceRequestTicket(String title, String description, com.itsm.ticket.ticket.domain.enums.TicketUrgency urgency) {
        super(title, description, TicketType.SERVICE_REQUEST, urgency);
        this.approval = new ServiceRequestApproval();
    }

    protected ServiceRequestTicket() {
    }

    /**
     * Resolution requires approval to be in APPROVED state (Doc §2.4):
     * "Approval tamamlanmadan RESOLVED durumuna geçilemez".
     */
    @Override
    public void resolve(TicketRole actor, String note, StatusTransitionPolicy policy) {
        if (this.approval == null) {
            throw new IllegalStateException("Service request approval record is missing");
        }
        if (this.approval.getState() != ServiceRequstApprovalStatus.APPROVED) {
            throw new IllegalStatusTransitionException(getStatus(), TicketStatus.RESOLVED, actor);
        }
        super.resolve(actor, note, policy);
    }

    public ServiceRequestApproval getApproval() {
        return approval;
    }
}
