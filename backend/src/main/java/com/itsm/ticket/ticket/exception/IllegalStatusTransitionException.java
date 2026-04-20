package com.itsm.ticket.ticket.exception;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

public class IllegalStatusTransitionException extends RuntimeException{
    public IllegalStatusTransitionException(TicketStatus from, TicketStatus to, TicketRole actor) {
        super("Role " + actor + " cannot transition from " + from + " to " + to);
    }}
