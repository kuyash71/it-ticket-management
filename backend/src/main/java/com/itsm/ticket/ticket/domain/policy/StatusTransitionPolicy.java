package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

/** Validates that a role-driven status transition is permitted by the lifecycle rules. */
public interface StatusTransitionPolicy {
    /** @throws com.itsm.ticket.ticket.exception.IllegalStatusTransitionException if the move is not allowed */
    void validateTicket(TicketStatus from, TicketStatus to, TicketRole actor);
}
