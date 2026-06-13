package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.TicketEvent;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/** Persistence operations for {@link TicketEvent}. */
public interface TicketEventRepository extends JpaRepository<TicketEvent, UUID> {
    List<TicketEvent> findByTicket_IdOrderByOccurredAtAsc(UUID ticketId);
    List<TicketEvent> findByTicket_IdAndVisibilityOrderByOccurredAtAsc(UUID ticketId, TicketEventVisibility visibility);
}
