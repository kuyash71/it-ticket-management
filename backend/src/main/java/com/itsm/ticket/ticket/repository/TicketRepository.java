package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Persistence operations for {@link Ticket}, including agent-queue and SLA-driven queries. */
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    /** Open tickets (status not in CLOSED/RESOLVED). */
    org.springframework.data.domain.Page<Ticket> findByStatusNotIn(List<TicketStatus> statuses, Pageable pageable);

    /** Customer view: only tickets the user opened. */
    List<Ticket> findByReporterId(String reporterId, Pageable pageable);

    /** Agent queue: (NEW + unassigned) ∪ (assigned to me AND NOT CLOSED/RESOLVED). */
    @org.springframework.data.jpa.repository.Query(
            "SELECT t FROM Ticket t WHERE " +
            "(t.status = com.itsm.ticket.ticket.domain.enums.TicketStatus.NEW AND t.assigneeId IS NULL) " +
            "OR (t.assigneeId = :assignee AND t.status NOT IN (" +
            "    com.itsm.ticket.ticket.domain.enums.TicketStatus.CLOSED," +
            "    com.itsm.ticket.ticket.domain.enums.TicketStatus.RESOLVED))")
    List<Ticket> findAgentQueue(@org.springframework.data.repository.query.Param("assignee") String assignee,
                                Pageable pageable);

    /**
     * Doc §4.2 Abandoned-case detection — WAITING_FOR_CUSTOMER tickets whose last status change
     * is older than the given threshold. {@code updatedAt} is bumped on every persistence change,
     * but reminder/abandoned scheduler tracks own bookkeeping fields, so this is just a coarse
     * pre-filter; the scheduler refines based on lastStatusChangeAt.
     */
    List<Ticket> findByStatusAndUpdatedAtBefore(TicketStatus status, Instant cutoff);

    /** Workload by assignee: returns [assigneeId, status, count] for non-closed tickets. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT t.assigneeId, t.status, COUNT(t) FROM Ticket t " +
            "WHERE t.assigneeId IS NOT NULL AND t.status <> 'CLOSED' " +
            "GROUP BY t.assigneeId, t.status")
    List<Object[]> agentWorkloadBreakdown();
}
