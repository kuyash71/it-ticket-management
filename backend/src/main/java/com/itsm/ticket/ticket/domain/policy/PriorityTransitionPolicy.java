package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketImpact;
import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;

/** Computes priority from impact × urgency (Doc §3.1 matrix). */
public interface PriorityTransitionPolicy {
    TicketPriority calculate(
        TicketImpact impact,
        TicketUrgency urgency);
}
