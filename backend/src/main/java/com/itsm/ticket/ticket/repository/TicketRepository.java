package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    /** Tickets with an active SLA clock (i.e. not yet resolved/closed). */
    List<Ticket> findByStatusNotIn(List<TicketStatus> statuses);
}
