package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

public record TransitionKey(TicketStatus from, TicketStatus to) {
    }
