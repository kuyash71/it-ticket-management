package com.itsm.ticket.ticket.domain;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue (
    value = "SERVICE_REQUEST"
)
public class ServiceRequestTicket extends Ticket {

    public ServiceRequestTicket(String title, String description) {
        super(title,description);
    }
    protected ServiceRequestTicket() {

    }
}
