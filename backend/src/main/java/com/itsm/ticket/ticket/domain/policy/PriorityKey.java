package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketImpact;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;

public record PriorityKey(TicketImpact impact, TicketUrgency urgency) {
}
