package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketImpact;
import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;

import java.util.HashMap;
import java.util.Map;
public class TicketPriorityTransition implements PriorityTransitionPolicy {
    private final Map<PriorityKey, TicketPriority> matrix;

    public TicketPriorityTransition() {
        matrix = new HashMap<>();

        matrix.put(
            new PriorityKey(TicketImpact.LOW, TicketUrgency.LOW),
           TicketPriority.LOW
        );
        matrix.put(
            new PriorityKey(TicketImpact.LOW, TicketUrgency.MEDIUM),
            TicketPriority.LOW
        );
        matrix.put(
            new PriorityKey(TicketImpact.LOW, TicketUrgency.HIGH),
            TicketPriority.MEDIUM
        );
        matrix.put(
            new PriorityKey(TicketImpact.MEDIUM, TicketUrgency.LOW),
            TicketPriority.LOW
        );
        matrix.put(
            new PriorityKey(TicketImpact.MEDIUM, TicketUrgency.MEDIUM),
            TicketPriority.MEDIUM
        );
        matrix.put(
            new PriorityKey(TicketImpact.MEDIUM, TicketUrgency.HIGH),
            TicketPriority.HIGH
        );
        matrix.put(
            new PriorityKey(TicketImpact.HIGH, TicketUrgency.LOW),
            TicketPriority.MEDIUM
        );
        matrix.put(
            new PriorityKey(TicketImpact.HIGH, TicketUrgency.MEDIUM),
            TicketPriority.HIGH
        );
        matrix.put(
            new PriorityKey(TicketImpact.HIGH, TicketUrgency.HIGH),
            TicketPriority.CRITICAL
        );
    }

    @Override
    public TicketPriority calculate(TicketImpact impact, TicketUrgency urgency) {
        TicketPriority result = matrix.get(new PriorityKey(impact, urgency));
        if(result == null) {throw new IllegalStateException("No priority defined for: " + impact + ", " + urgency);}
        return result;
    }
}
