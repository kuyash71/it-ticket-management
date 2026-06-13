package com.itsm.ticket.reporting.repository;

import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Aggregate queries powering {@code ReportService}. Returns raw object arrays for grouped results. */
public interface ReportRepository extends Repository<Ticket, UUID> {

    @Query("SELECT t.status, COUNT(t) FROM Ticket t GROUP BY t.status")
    List<Object[]> countByStatus();

    @Query("SELECT t.type, COUNT(t) FROM Ticket t GROUP BY t.type")
    List<Object[]> countByType();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenTickets();

    @Query("SELECT COUNT(t) FROM Ticket t JOIN t.slaClock sc WHERE sc.state = :state")
    long countBySlaClock(SLAClockState state);

    @Query("SELECT COUNT(t) FROM Ticket t JOIN t.slaClock sc WHERE sc.state = :state AND sc.elapsed > sc.deadline AND sc.deadline > 0")
    long countSlaBreaches(SLAClockState state);

    @Query("SELECT AVG(sc.elapsed) FROM Ticket t JOIN t.slaClock sc WHERE sc.state = :state")
    Optional<Double> avgElapsedSeconds(SLAClockState state);

    // ── Feedback metrikleri (Doc §4.4.6) ──────────────────────────

    @Query("SELECT COUNT(f) FROM TicketFeedback f")
    long countFeedback();

    @Query("SELECT AVG(f.rating) FROM TicketFeedback f")
    Optional<Double> avgFeedbackRating();

    /** [rating, count] satırları — rating dağılımı için. */
    @Query("SELECT f.rating, COUNT(f) FROM TicketFeedback f GROUP BY f.rating ORDER BY f.rating")
    List<Object[]> ratingDistribution();

    /** [agentId, count, avgRating] — agent bazında özet (agentId null olabilir). */
    @Query("SELECT f.agentId, COUNT(f), AVG(f.rating) FROM TicketFeedback f " +
           "WHERE f.agentId IS NOT NULL GROUP BY f.agentId ORDER BY AVG(f.rating) DESC")
    List<Object[]> agentBreakdown();
}
