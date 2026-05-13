package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.TicketAction;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Computes which actions a given role can perform on a ticket in its current state.
 * Doc §11 — Backend response should include allowedActions[] so the UI hides unauthorized buttons.
 *
 * Uses virtual-dispatch methods (isPendingApproval, isApproved) instead of instanceof to
 * avoid Hibernate proxy type-erasure silently breaking SERVICE_REQUEST checks.
 */
public final class AllowedActionsService {

    public List<TicketAction> compute(Ticket ticket, TicketRole role) {
        EnumSet<TicketAction> actions = EnumSet.noneOf(TicketAction.class);
        TicketStatus status = ticket.getStatus();

        if (status == TicketStatus.CLOSED) {
            return List.of();
        }

        switch (role) {
            case CUSTOMER -> addCustomerActions(actions, ticket, status);
            case AGENT -> addAgentActions(actions, ticket, status);
            case MANAGER -> addManagerActions(actions, ticket, status);
        }

        return List.copyOf(actions);
    }

    private void addCustomerActions(Set<TicketAction> actions, Ticket ticket, TicketStatus status) {
        actions.add(TicketAction.ADD_COMMENT);
        actions.add(TicketAction.ADD_ATTACHMENT);
        if (status == TicketStatus.WAITING_FOR_CUSTOMER) {
            // Customer has responded and wants work to resume (Doc §4.1 "Customer replied").
            // REQUEST_INFO re-uses the same WAITING→IN_PROGRESS transition in the backend.
            actions.add(TicketAction.REQUEST_INFO);
        }
        if (status == TicketStatus.RESOLVED) {
            actions.add(TicketAction.CONFIRM_CLOSE);
            // Doc §11 — customer may reopen a resolved ticket (RESOLVED→IN_PROGRESS).
            actions.add(TicketAction.REOPEN_REQUEST);
        }
    }

    private void addAgentActions(Set<TicketAction> actions, Ticket ticket, TicketStatus status) {
        actions.add(TicketAction.ADD_COMMENT);
        actions.add(TicketAction.ADD_WORKLOG);
        actions.add(TicketAction.ADD_ATTACHMENT);
        actions.add(TicketAction.CHANGE_PRIORITY);

        switch (status) {
            case NEW -> {
                // Unapproved service requests cannot be taken into progress (Doc §2.4).
                if (!ticket.isPendingApproval()) {
                    actions.add(TicketAction.TAKE_OWNERSHIP);
                }
            }
            case IN_PROGRESS -> {
                // REQUEST_INFO (WAITING_FOR_CUSTOMER geçişi) plain transitions aracılığıyla gösteriliyor.
                if (ticket.isApproved()) {
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

        // Approve/reject only available while approval is still PENDING (virtual dispatch — no instanceof).
        if (ticket.isPendingApproval()) {
            actions.add(TicketAction.APPROVE_REQUEST);
            actions.add(TicketAction.REJECT_REQUEST);
        }
    }
}
