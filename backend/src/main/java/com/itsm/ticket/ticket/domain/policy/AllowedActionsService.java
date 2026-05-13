package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.ServiceRequestTicket;
import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import com.itsm.ticket.ticket.domain.enums.TicketAction;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Computes which actions a given role can perform on a ticket in its current state.
 * Doc §11 — Backend response should include allowedActions[] so the UI hides unauthorized buttons.
 */
public final class AllowedActionsService {

    public List<TicketAction> compute(Ticket ticket, TicketRole role) {
        EnumSet<TicketAction> actions = EnumSet.noneOf(TicketAction.class);
        TicketStatus status = ticket.getStatus();

        if (status == TicketStatus.CLOSED) {
            return List.of();
        }

        switch (role) {
            case CUSTOMER -> addCustomerActions(actions, status);
            case AGENT -> addAgentActions(actions, ticket, status);
            case MANAGER -> addManagerActions(actions, ticket, status);
        }

        return List.copyOf(actions);
    }

    private void addCustomerActions(Set<TicketAction> actions, TicketStatus status) {
        actions.add(TicketAction.ADD_COMMENT);
        actions.add(TicketAction.ADD_ATTACHMENT);
        if (status == TicketStatus.WAITING_FOR_CUSTOMER) {
            // Customer replies -> back to IN_PROGRESS (Doc §4.1)
            actions.add(TicketAction.REQUEST_INFO); // re-engage agent; same transition
        }
        if (status == TicketStatus.RESOLVED) {
            actions.add(TicketAction.CONFIRM_CLOSE);
            actions.add(TicketAction.REOPEN_REQUEST); // Doc §11 reopen scenario
        }
    }

    private void addAgentActions(Set<TicketAction> actions, Ticket ticket, TicketStatus status) {
        actions.add(TicketAction.ADD_COMMENT);
        actions.add(TicketAction.ADD_WORKLOG);
        actions.add(TicketAction.ADD_ATTACHMENT);
        actions.add(TicketAction.CHANGE_PRIORITY);

        switch (status) {
            case NEW -> actions.add(TicketAction.TAKE_OWNERSHIP);
            case IN_PROGRESS -> {
                actions.add(TicketAction.REQUEST_INFO);
                if (canResolve(ticket)) {
                    actions.add(TicketAction.RESOLVE);
                }
            }
            // WAITING_FOR_CUSTOMER and RESOLVED: agent waits — no transition actions
            default -> { /* no extra actions */ }
        }
    }

    private void addManagerActions(Set<TicketAction> actions, Ticket ticket, TicketStatus status) {
        addAgentActions(actions, ticket, status);
        actions.add(TicketAction.OVERRIDE_STATUS);
        actions.add(TicketAction.REASSIGN);
        actions.add(TicketAction.FORCE_CLOSE);

        if (ticket instanceof ServiceRequestTicket sr
                && sr.getApproval() != null
                && sr.getApproval().getState() == ServiceRequstApprovalStatus.PENDING) {
            actions.add(TicketAction.APPROVE_REQUEST);
            actions.add(TicketAction.REJECT_REQUEST);
        }
    }

    private boolean canResolve(Ticket ticket) {
        if (ticket instanceof ServiceRequestTicket sr) {
            return sr.getApproval() != null
                    && sr.getApproval().getState() == ServiceRequstApprovalStatus.APPROVED;
        }
        return true;
    }
}
