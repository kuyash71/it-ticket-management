package com.itsm.ticket.ticket.domain;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue(
    value = "INCIDENT"
)
public class IncidentTicket extends Ticket {
    public IncidentTicket(String title, String description) {
        super(title,description);
    }
    protected IncidentTicket() {

    }
}
