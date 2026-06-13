package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.AuditRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/** Persistence operations for {@link AuditRecord}. */
public interface AuditRecordRepository extends JpaRepository<AuditRecord, UUID> {
    List<AuditRecord> findByTicket_IdOrderByOccurredAtAsc(UUID ticketId);
}
