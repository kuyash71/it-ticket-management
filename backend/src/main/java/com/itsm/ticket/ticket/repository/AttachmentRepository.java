package com.itsm.ticket.ticket.repository;

import com.itsm.ticket.ticket.domain.Attachment;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByTicket_IdOrderByUploadedAtDesc(UUID ticketId);
    List<Attachment> findByTicket_IdAndVisibilityOrderByUploadedAtDesc(UUID ticketId, TicketEventVisibility visibility);
    java.util.Optional<Attachment> findByIdAndTicket_Id(UUID id, UUID ticketId);
}
