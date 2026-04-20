package com.itsm.ticket.ticket.exception;

import java.util.UUID;

public class TicketNotFoundException extends RuntimeException {
    public TicketNotFoundException(UUID uuid) {
        super("UUID: " + uuid + ", TICKET NOT FOUND");
    }
}
