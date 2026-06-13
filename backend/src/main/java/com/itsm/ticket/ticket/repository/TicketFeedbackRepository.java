package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.TicketFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/** Persistence operations for {@link TicketFeedback}. One row per ticket. */
public interface TicketFeedbackRepository extends JpaRepository<TicketFeedback, UUID> {
    Optional<TicketFeedback> findByTicketId(UUID ticketId);
    boolean existsByTicketId(UUID ticketId);
}
