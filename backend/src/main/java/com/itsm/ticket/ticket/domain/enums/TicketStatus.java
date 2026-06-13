package com.itsm.ticket.ticket.domain.enums;

/** Lifecycle states a ticket can occupy (Doc §4.1). */
public enum TicketStatus {
    NEW,
    IN_PROGRESS,
    WAITING_FOR_CUSTOMER,
    RESOLVED,
    CLOSED
}
