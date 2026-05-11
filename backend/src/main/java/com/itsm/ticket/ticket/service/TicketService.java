package com.itsm.ticket.ticket.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.ticket.api.AddAttachmentRequest;
import com.itsm.ticket.ticket.api.AddCommentRequest;
import com.itsm.ticket.ticket.api.AddWorklogRequest;
import com.itsm.ticket.ticket.domain.*;
import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.exception.TicketNotFoundException;
import com.itsm.ticket.ticket.notification.NotificationService;
import com.itsm.ticket.ticket.api.CreateTicketRequest;
import com.itsm.ticket.ticket.domain.policy.TicketStatusTransition;
import com.itsm.ticket.ticket.repository.AttachmentRepository;
import com.itsm.ticket.ticket.repository.TicketEventRepository;
import com.itsm.ticket.ticket.repository.TicketRepository;
import com.itsm.ticket.workflow.TicketWorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketEventRepository ticketEventRepository;
    private final AttachmentRepository attachmentRepository;
    private final TicketWorkflowService workflowService;
    private final KafkaLogProducer kafkaLogProducer;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public TicketService(TicketRepository ticketRepository,
                         TicketEventRepository ticketEventRepository,
                         AttachmentRepository attachmentRepository,
                         TicketWorkflowService workflowService,
                         KafkaLogProducer kafkaLogProducer,
                         NotificationService notificationService,
                         ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.ticketEventRepository = ticketEventRepository;
        this.attachmentRepository = attachmentRepository;
        this.workflowService = workflowService;
        this.kafkaLogProducer = kafkaLogProducer;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Ticket create(CreateTicketRequest request, String actorId) {
        Ticket ticket = switch (request.type()) {
            case INCIDENT -> new IncidentTicket(request.title(), request.description());
            case SERVICE_REQUEST -> new ServiceRequestTicket(request.title(), request.description());
        };

        ticketRepository.save(ticket);

        String processInstanceId = workflowService.startTicketLifecycle(Map.of(
                "ticketId", ticket.getId().toString(),
                "ticketType", request.type().name(),
                "ticketStatus", ticket.getStatus().name()
        ));
        ticket.setProcessInstanceId(processInstanceId);

        String detail = toJson(Map.of("type", request.type().name()));
        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "TICKET_CREATED", "ticketId", ticket.getId().toString())));
        ticket.audit(actorId, CatalogEventType.TICKET_CREATED, null, detail);

        ticketRepository.save(ticket);

        kafkaLogProducer.publish("TICKET_CREATED", Map.of(
                "ticketId", ticket.getId().toString(),
                "title", ticket.getTitle(),
                "type", request.type().name()
        ));

        notificationService.notify(ticket.getId(), CatalogEventType.TICKET_CREATED, Map.of());
        return ticket;
    }

    @Transactional
    public Ticket changeStatus(UUID ticketId, TicketStatus target, TicketRole actor, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        String previousStatus = ticket.getStatus().name();

        ticket.transitionTo(target, actor, new TicketStatusTransition());

        String detail = toJson(Map.of("from", previousStatus, "to", target.name()));
        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "STATUS_CHANGED", "from", previousStatus, "to", target.name())));
        ticket.audit(actorId, CatalogEventType.STATUS_CHANGED, null, detail);

        ticketRepository.save(ticket);

        notificationService.notify(ticket.getId(), CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", target.name()));
        return ticket;
    }

    @Transactional
    public TicketEvent addComment(UUID ticketId, AddCommentRequest request, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        TicketEvent event = ticket.addComment(actorId, request.body(), request.visibility(), request.parentId());
        ticket.audit(actorId, CatalogEventType.COMMENT_ADDED, null,
                toJson(Map.of("visibility", request.visibility().name())));
        ticketRepository.save(ticket);
        return event;
    }

    @Transactional
    public TicketEvent addWorklog(UUID ticketId, AddWorklogRequest request, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        TicketEvent event = ticket.addWorklog(actorId, request.body(), request.visibility());
        ticket.audit(actorId, CatalogEventType.WORKLOG_ADDED, null,
                toJson(Map.of("visibility", request.visibility().name())));
        ticketRepository.save(ticket);
        return event;
    }

    @Transactional
    public Attachment addAttachment(UUID ticketId, AddAttachmentRequest request, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        Attachment attachment = ticket.attach(request.fileName(), request.mimeType(),
                request.sizeBytes(), request.storageKey(), request.visibility(), actorId);

        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "ATTACHMENT_ADDED", "fileName", request.fileName())));
        ticket.audit(actorId, CatalogEventType.ATTACHMENT_ADDED, null,
                toJson(Map.of("fileName", request.fileName(), "visibility", request.visibility().name())));

        ticketRepository.save(ticket);

        notificationService.notify(ticket.getId(), CatalogEventType.ATTACHMENT_ADDED,
                Map.of("visibility", request.visibility().name()));
        return attachment;
    }

    @Transactional(readOnly = true)
    public List<Ticket> list() {
        return ticketRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TicketEvent> getTimeline(UUID ticketId, boolean customerView) {
        loadOrThrow(ticketId);
        if (customerView) {
            return ticketEventRepository.findByTicket_IdAndVisibilityOrderByOccurredAtAsc(
                    ticketId, TicketEventVisibility.EXTERNAL);
        }
        return ticketEventRepository.findByTicket_IdOrderByOccurredAtAsc(ticketId);
    }

    @Transactional(readOnly = true)
    public List<Attachment> getAttachments(UUID ticketId, boolean customerView) {
        loadOrThrow(ticketId);
        if (customerView) {
            return attachmentRepository.findByTicket_IdAndVisibilityOrderByUploadedAtDesc(
                    ticketId, TicketEventVisibility.EXTERNAL);
        }
        return attachmentRepository.findByTicket_IdOrderByUploadedAtDesc(ticketId);
    }

    private Ticket loadOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
    }

    private String toJson(Map<String, String> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
