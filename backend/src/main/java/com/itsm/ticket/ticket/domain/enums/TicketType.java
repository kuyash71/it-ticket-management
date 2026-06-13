package com.itsm.ticket.ticket.domain.enums;

/** Discriminator backing the JOINED inheritance hierarchy on {@link com.itsm.ticket.ticket.domain.Ticket}. */
public enum TicketType {
    INCIDENT,
    SERVICE_REQUEST
}
