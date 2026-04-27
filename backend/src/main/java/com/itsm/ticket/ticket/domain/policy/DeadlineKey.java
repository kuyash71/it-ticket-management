package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketType;

public record DeadlineKey(TicketType type, TicketPriority priority) {
}
