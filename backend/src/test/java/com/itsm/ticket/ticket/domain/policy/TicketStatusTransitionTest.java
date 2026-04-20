package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.exception.IllegalStatusTransitionException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class TicketStatusTransitionTest {

    private final TicketStatusTransition policy = new TicketStatusTransition();

    @Test
    void invalidTransition_shouldThrow() {
        assertThrows(IllegalStatusTransitionException.class, () ->
            policy.validateTicket(TicketStatus.CLOSED, TicketStatus.NEW, TicketRole.AGENT)
        );
    }

    @Test
    void validTransition_shouldNotThrow() {
        assertDoesNotThrow(() ->
            policy.validateTicket(TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketRole.AGENT)
        );
    }

    @Test
    void unauthorizedRole_shouldThrow() {
        assertThrows(IllegalStatusTransitionException.class, () ->
            policy.validateTicket(TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketRole.CUSTOMER)
        );
    }
}
