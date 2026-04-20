package com.itsm.ticket.ticket.exception;

import com.itsm.ticket.ticket.domain.enums.TicketRole;

public class UnauthorizedOperationException extends RuntimeException {
        public UnauthorizedOperationException(TicketRole role) {
        super("ROLE: " + role + ", Can't do this action due to lack of permission.");
    }
}
