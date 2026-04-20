package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

public interface StatusTransitionPolicy {
    void validateTicket(TicketStatus from, TicketStatus to, TicketRole actor);
}
