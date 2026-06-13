package com.itsm.ticket.ticket.exception;

import java.util.UUID;

/** Thrown when a ticket id does not exist. Maps to HTTP 404. */
public class TicketNotFoundException extends RuntimeException {
    public TicketNotFoundException(UUID uuid) {
        super("UUID: " + uuid + ", TICKET NOT FOUND");
    }
}
