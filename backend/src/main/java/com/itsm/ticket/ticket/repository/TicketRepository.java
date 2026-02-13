package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
}
