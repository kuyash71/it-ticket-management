package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.exception.IllegalStatusTransitionException;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class TicketStatusTransition implements StatusTransitionPolicy {

    private final Map<TransitionKey, Set<TicketRole>> transitions;

    public TicketStatusTransition() {
        transitions = new HashMap<>();

        transitions.put(
            new TransitionKey(TicketStatus.NEW, TicketStatus.IN_PROGRESS),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );
        transitions.put(
            new TransitionKey(TicketStatus.NEW, TicketStatus.WAITING_FOR_CUSTOMER),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );
        transitions.put(
            new TransitionKey(TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );
        transitions.put(
            new TransitionKey(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );
        transitions.put(
            new TransitionKey(TicketStatus.WAITING_FOR_CUSTOMER, TicketStatus.IN_PROGRESS),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );
        transitions.put(
            new TransitionKey(TicketStatus.RESOLVED, TicketStatus.CLOSED),
            Set.of(TicketRole.AGENT, TicketRole.MANAGER)
        );

    }

    @Override
    public void validateTicket(TicketStatus from, TicketStatus to, TicketRole actor) {
        Set<TicketRole> allowed = transitions.get(new TransitionKey(from, to));

        if (allowed == null) {
            throw new IllegalStatusTransitionException(from,to,actor);

        }
        if(!allowed.contains(actor)) {
            throw new IllegalStatusTransitionException(from,to,actor);
        }


    }
}
