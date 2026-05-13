package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("INCIDENT")
public class IncidentTicket extends Ticket {
    public IncidentTicket(String title, String description) {
        super(title, description, TicketType.INCIDENT);
    }
    public IncidentTicket(String title, String description, TicketUrgency urgency) {
        super(title, description, TicketType.INCIDENT, urgency);
    }
    protected IncidentTicket() {
    }
}
