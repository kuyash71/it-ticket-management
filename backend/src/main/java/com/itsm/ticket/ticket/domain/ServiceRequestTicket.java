package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.domain.policy.StatusTransitionPolicy;
import com.itsm.ticket.ticket.exception.IllegalStatusTransitionException;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue (
    value = "SERVICE_REQUEST"
)
public class ServiceRequestTicket extends Ticket {

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "request_approval_id", referencedColumnName="id")
    private ServiceRequestApproval approval;

    public ServiceRequestTicket(String title, String description) {
        super(title, description, TicketType.SERVICE_REQUEST);
        this.approval = new ServiceRequestApproval();
    }

    @Override
    public void transitionTo(TicketStatus target, TicketRole actor, StatusTransitionPolicy policy) {
        policy.validateTicket(super.getStatus(), target, actor);
        if(this.approval.getState() == ServiceRequstApprovalStatus.APPROVED && target == TicketStatus.RESOLVED) {
            this.getSlaClock().stop();
            super.setStatus(target);
        }else {
            if(target == TicketStatus.RESOLVED) {
                throw new IllegalStatusTransitionException(super.getStatus(), target, actor);
            }else {
                switch (target) {
                    case IN_PROGRESS -> this.getSlaClock().resume();
                    case WAITING_FOR_CUSTOMER -> this.getSlaClock().pause();
                }
                super.setStatus(target);
            }

        }
    }

    protected ServiceRequestTicket() {

    }
}
