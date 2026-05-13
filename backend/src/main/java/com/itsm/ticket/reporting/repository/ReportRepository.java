package com.itsm.ticket.reporting.repository;

import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
}
