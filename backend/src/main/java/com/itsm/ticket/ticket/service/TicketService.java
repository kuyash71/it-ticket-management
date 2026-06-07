package com.itsm.ticket.ticket.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.logging.LogEvent;
import com.itsm.ticket.ticket.api.AddAttachmentRequest;
import com.itsm.ticket.ticket.api.AddCommentRequest;
import com.itsm.ticket.ticket.api.AddComplaintRequest;
import com.itsm.ticket.ticket.api.AddWorklogRequest;
import com.itsm.ticket.ticket.api.ChangePriorityRequest;
import com.itsm.ticket.ticket.api.SubmitFeedbackRequest;
import com.itsm.ticket.ticket.domain.*;
import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.ServiceRequstApprovalStatus;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.exception.TicketNotFoundException;
import com.itsm.ticket.ticket.exception.UnauthorizedOperationException;
import com.itsm.ticket.ticket.notification.NotificationService;
import com.itsm.ticket.ticket.api.CreateTicketRequest;
import com.itsm.ticket.ticket.domain.policy.TicketStatusTransition;
import com.itsm.ticket.ticket.repository.AttachmentRepository;
import com.itsm.ticket.ticket.repository.TicketEventRepository;
import com.itsm.ticket.ticket.repository.TicketRepository;
import com.itsm.ticket.workflow.TicketWorkflowService;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Core business logic for the ticket lifecycle.
 *
 * <p>Every state-changing operation emits a structured {@link com.itsm.ticket.logging.LogEvent}
 * to Kafka and records an immutable {@link com.itsm.ticket.ticket.domain.TicketEvent} in the
 * timeline. Status transitions are validated by {@link com.itsm.ticket.ticket.domain.policy.TicketStatusTransition}
 * and authorisation checks enforce role-based rules defined in the analysis document.
 */
@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketEventRepository ticketEventRepository;
    private final AttachmentRepository attachmentRepository;
    private final com.itsm.ticket.ticket.repository.TicketFeedbackRepository feedbackRepository;
    private final TicketWorkflowService workflowService;
    private final KafkaLogProducer kafkaLogProducer;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final AttachmentStorageService attachmentStorage;

    public TicketService(TicketRepository ticketRepository,
                         TicketEventRepository ticketEventRepository,
                         AttachmentRepository attachmentRepository,
                         com.itsm.ticket.ticket.repository.TicketFeedbackRepository feedbackRepository,
                         TicketWorkflowService workflowService,
                         KafkaLogProducer kafkaLogProducer,
                         NotificationService notificationService,
                         ObjectMapper objectMapper,
                         AttachmentStorageService attachmentStorage) {
        this.ticketRepository = ticketRepository;
        this.ticketEventRepository = ticketEventRepository;
        this.attachmentRepository = attachmentRepository;
        this.feedbackRepository = feedbackRepository;
        this.workflowService = workflowService;
        this.kafkaLogProducer = kafkaLogProducer;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
        this.attachmentStorage = attachmentStorage;
    }

    @Transactional
    public Ticket create(CreateTicketRequest request, String actorId) {
        Ticket ticket = switch (request.type()) {
            case INCIDENT -> new IncidentTicket(request.title(), request.description(), request.urgency());
            case SERVICE_REQUEST -> new ServiceRequestTicket(request.title(), request.description(), request.urgency());
        };

        ticket.setReporterId(actorId);
        ticketRepository.save(ticket);

        String processInstanceId = workflowService.startTicketLifecycle(Map.of(
                "ticketId", ticket.getId().toString(),
                "ticketType", request.type().name(),
                "ticketStatus", ticket.getStatus().name()
        ));
        ticket.setProcessInstanceId(processInstanceId);

        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "TICKET_CREATED", "ticketId", ticket.getId().toString())));
        ticket.audit(actorId, CatalogEventType.TICKET_CREATED, null,
                toJson(Map.of("type", request.type().name())));

        // Initial attachments uploaded together with the ticket (Doc §7).
        if (request.attachments() != null) {
            for (CreateTicketRequest.AttachmentInput input : request.attachments()) {
                ticket.attach(input.fileName(), input.mimeType(), input.sizeBytes(),
                        input.storageKey(), input.visibility(), actorId);
                ticket.recordSystemEvent(actorId, toJson(Map.of(
                        "event", "ATTACHMENT_ADDED", "fileName", input.fileName())));
                ticket.audit(actorId, CatalogEventType.ATTACHMENT_ADDED, null,
                        toJson(Map.of("fileName", input.fileName(),
                                "visibility", input.visibility().name())));
            }
        }

        ticketRepository.save(ticket);

        withMdc(ticket.getId(), actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("TICKET_CREATED", ticket.getId().toString(), actorId,
                    Map.of("title", ticket.getTitle(), "type", request.type().name(),
                            "attachments", request.attachments() == null ? "0" : String.valueOf(request.attachments().size()))))
        );

        notificationService.notify(ticket.getId(), CatalogEventType.TICKET_CREATED, Map.of());
        return ticket;
    }

    @Transactional
    public Ticket changeStatus(UUID ticketId, TicketStatus target, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousStatus = ticket.getStatus().name();

        ticket.transitionTo(target, actor, new TicketStatusTransition());

        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "STATUS_CHANGED", "from", previousStatus, "to", target.name())));
        ticket.audit(actorId, CatalogEventType.STATUS_CHANGED, null,
                toJson(Map.of("from", previousStatus, "to", target.name())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("STATUS_CHANGED", ticketId.toString(), actorId,
                    Map.of("from", previousStatus, "to", target.name())))
        );

        notificationService.notify(ticket.getId(), CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", target.name()));
        return ticket;
    }

    /**
     * RESOLVED with mandatory resolution note (Doc §4.1).
     */
    @Transactional
    public Ticket resolve(UUID ticketId, String resolutionNote,
                          com.itsm.ticket.ticket.domain.enums.ResolutionCode resolutionCode,
                          TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousStatus = ticket.getStatus().name();

        ticket.resolve(actor, resolutionNote, resolutionCode, new TicketStatusTransition());

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "STATUS_CHANGED",
                "from", previousStatus,
                "to", TicketStatus.RESOLVED.name())));
        ticket.audit(actorId, CatalogEventType.STATUS_CHANGED, resolutionNote,
                toJson(Map.of("from", previousStatus, "to", TicketStatus.RESOLVED.name(),
                        "resolutionNote", resolutionNote,
                        "resolutionCode", resolutionCode.name())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("TICKET_RESOLVED", ticketId.toString(), actorId,
                        Map.of("from", previousStatus, "resolutionNote", resolutionNote,
                                "resolutionCode", resolutionCode.name()))));

        notificationService.notify(ticket.getId(), CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", TicketStatus.RESOLVED.name()));
        return ticket;
    }

    /**
     * Customer confirms closure of a RESOLVED ticket (Doc §4.1).
     */
    @Transactional
    public Ticket confirmClose(UUID ticketId, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousStatus = ticket.getStatus().name();

        ticket.confirmClose(actor, new TicketStatusTransition());

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "STATUS_CHANGED",
                "from", previousStatus,
                "to", TicketStatus.CLOSED.name(),
                "by", "CUSTOMER_CONFIRM")));
        ticket.audit(actorId, CatalogEventType.STATUS_CHANGED, "Customer confirmed closure",
                toJson(Map.of("from", previousStatus, "to", TicketStatus.CLOSED.name(),
                        "trigger", "CUSTOMER_CONFIRM")));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("TICKET_CLOSED", ticketId.toString(), actorId,
                        Map.of("trigger", "CUSTOMER_CONFIRM"))));

        notificationService.notify(ticket.getId(), CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", TicketStatus.CLOSED.name()));
        return ticket;
    }

    /**
     * Manager force-close with mandatory reason (Doc §9 — reason + audit zorunlu).
     */
    @Transactional
    public Ticket forceClose(UUID ticketId, String reason, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousStatus = ticket.getStatus().name();

        ticket.forceClose(actor, reason);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "STATUS_CHANGED",
                "from", previousStatus,
                "to", TicketStatus.CLOSED.name(),
                "by", "MANAGER_FORCE")));
        ticket.audit(actorId, CatalogEventType.MANAGER_OVERRIDE, reason,
                toJson(Map.of("from", previousStatus, "to", TicketStatus.CLOSED.name(),
                        "trigger", "MANAGER_FORCE_CLOSE", "reason", reason)));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("TICKET_FORCE_CLOSED", ticketId.toString(), actorId,
                        Map.of("from", previousStatus, "reason", reason))));

        notificationService.notify(ticket.getId(), CatalogEventType.MANAGER_OVERRIDE,
                Map.of("newStatus", TicketStatus.CLOSED.name()));
        return ticket;
    }

    /**
     * Manager OVERRIDE_STATUS (Doc §5.4.3 'Any → IN_PROGRESS by Manager: gerekçe zorunlu').
     * Bypasses transition policy; reason required.
     */
    @Transactional
    public Ticket overrideStatus(UUID ticketId, TicketStatus target, String reason,
                                 TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        TicketStatus previousStatus = ticket.getStatus();

        ticket.overrideStatus(actor, target, reason);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "STATUS_CHANGED",
                "from", previousStatus.name(),
                "to", target.name(),
                "by", "MANAGER_OVERRIDE")));
        ticket.audit(actorId, CatalogEventType.MANAGER_OVERRIDE, reason,
                toJson(Map.of("from", previousStatus.name(), "to", target.name(),
                        "trigger", "OVERRIDE_STATUS", "reason", reason)));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("STATUS_OVERRIDDEN", ticketId.toString(), actorId,
                        Map.of("from", previousStatus.name(), "to", target.name(), "reason", reason))));

        notificationService.notify(ticket.getId(), CatalogEventType.MANAGER_OVERRIDE,
                Map.of("newStatus", target.name()));
        return ticket;
    }

    /**
     * Agent (or manager) self-assigns a NEW ticket (Doc §11 TAKE_OWNERSHIP).
     * NEW → IN_PROGRESS happens atomically inside the aggregate.
     */
    @Transactional
    public Ticket takeOwnership(UUID ticketId, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousStatus = ticket.getStatus().name();
        String previousAssignee = ticket.getAssigneeId();

        ticket.takeOwnership(actor, actorId, new TicketStatusTransition());

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "ASSIGNMENT_CHANGED",
                "from", previousAssignee == null ? "" : previousAssignee,
                "to", actorId,
                "trigger", "TAKE_OWNERSHIP")));
        ticket.audit(actorId, CatalogEventType.ASSIGNMENT_CHANGED, "Self-assigned via take-ownership",
                toJson(Map.of("from", previousAssignee == null ? "" : previousAssignee,
                        "to", actorId,
                        "previousStatus", previousStatus,
                        "newStatus", ticket.getStatus().name())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("ASSIGNMENT_CHANGED", ticketId.toString(), actorId,
                        Map.of("to", actorId, "trigger", "TAKE_OWNERSHIP"))));
        return ticket;
    }

    /**
     * Manager reassigns to another agent with a mandatory reason (Doc §9).
     */
    @Transactional
    public Ticket reassign(UUID ticketId, String newAssignee, String reason,
                           TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        String previousAssignee = ticket.reassign(actor, newAssignee, reason);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "ASSIGNMENT_CHANGED",
                "from", previousAssignee == null ? "" : previousAssignee,
                "to", newAssignee,
                "trigger", "MANAGER_REASSIGN")));
        ticket.audit(actorId, CatalogEventType.ASSIGNMENT_CHANGED, reason,
                toJson(Map.of("from", previousAssignee == null ? "" : previousAssignee,
                        "to", newAssignee, "reason", reason)));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("ASSIGNMENT_CHANGED", ticketId.toString(), actorId,
                        Map.of("to", newAssignee, "reason", reason))));
        return ticket;
    }

    /**
     * Priority change with mandatory reason (Doc §3.2 — audit zorunlu).
     */
    @Transactional
    public Ticket changePriority(UUID ticketId, ChangePriorityRequest request,
                                 TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        TicketPriority previous = ticket.changePriority(
                request.impact(), request.urgency(), request.reason(), actor);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "PRIORITY_CHANGED",
                "from", previous.name(),
                "to", ticket.getPriority().name())));
        ticket.audit(actorId, CatalogEventType.PRIORITY_CHANGED, request.reason(),
                toJson(Map.of(
                        "from", previous.name(),
                        "to", ticket.getPriority().name(),
                        "impact", ticket.getImpact().name(),
                        "urgency", ticket.getUrgency().name(),
                        "reason", request.reason())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("PRIORITY_CHANGED", ticketId.toString(), actorId,
                        Map.of("from", previous.name(), "to", ticket.getPriority().name(),
                                "reason", request.reason()))));

        return ticket;
    }

    @Transactional
    public TicketEvent addComment(UUID ticketId, AddCommentRequest request, String actorId, boolean isCustomer) {
        if (isCustomer && request.visibility() == TicketEventVisibility.INTERNAL) {
            throw new UnauthorizedOperationException("Customers cannot post internal comments");
        }
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, isCustomer, actorId);
        TicketEvent event = ticket.addComment(actorId, request.body(), request.visibility(), request.parentId());
        ticket.audit(actorId, CatalogEventType.COMMENT_ADDED, null,
                toJson(Map.of("visibility", request.visibility().name())));
        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("COMMENT_ADDED", ticketId.toString(), actorId,
                    Map.of("visibility", request.visibility().name())))
        );
        return event;
    }

    /**
     * Doc §7.8 — Customer files a service-quality complaint against this ticket.
     * Stored as an INTERNAL ticket event so agent/manager timelines pick it up but the
     * customer view stays focused on the resolution conversation. Manager notified via
     * the existing notification channel.
     */
    @Transactional
    public TicketEvent addComplaint(UUID ticketId, AddComplaintRequest request, String actorId, boolean isCustomer) {
        if (!isCustomer) {
            throw new UnauthorizedOperationException("Only customers can file service-quality complaints");
        }
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, isCustomer, actorId);
        TicketEvent event = ticket.addComplaint(actorId, request.body());
        ticket.audit(actorId, CatalogEventType.SERVICE_QUALITY_COMPLAINT, null,
                toJson(Map.of("ticketId", ticketId.toString())));
        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("SERVICE_QUALITY_COMPLAINT", ticketId.toString(), actorId,
                    Map.of("assignee", ticket.getAssigneeId() != null ? ticket.getAssigneeId() : "")))
        );
        notificationService.notify(ticket.getId(), CatalogEventType.SERVICE_QUALITY_COMPLAINT, Map.of());
        return event;
    }

    @Transactional
    public TicketEvent addWorklog(UUID ticketId, AddWorklogRequest request, String actorId, boolean isCustomer) {
        if (isCustomer) {
            throw new UnauthorizedOperationException("Only agents and managers can add worklogs");
        }
        Ticket ticket = loadOrThrow(ticketId);
        TicketEvent event = ticket.addWorklog(actorId, request.body(), request.visibility());
        // (Agent/Manager — sahiplik kontrolü gerekmez; rol AGENT/MANAGER zaten doğrulandı.)
        ticket.audit(actorId, CatalogEventType.WORKLOG_ADDED, null,
                toJson(Map.of("visibility", request.visibility().name())));
        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("WORKLOG_ADDED", ticketId.toString(), actorId,
                    Map.of("visibility", request.visibility().name())))
        );
        return event;
    }

    /**
     * Multipart upload variant — accepts a real {@link MultipartFile}, persists bytes via
     * {@link AttachmentStorageService}, and creates the Attachment record with audit+event.
     */
    @Transactional
    public Attachment uploadAttachment(UUID ticketId, MultipartFile file,
                                       TicketEventVisibility visibility, String actorId,
                                       boolean isCustomer) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, isCustomer, actorId);
        if (isCustomer && visibility == TicketEventVisibility.INTERNAL) {
            throw new UnauthorizedOperationException("Customers cannot upload internal attachments");
        }
        String storageKey = attachmentStorage.store(ticketId, file);
        String fileName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String mimeType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        Attachment attachment = ticket.attach(fileName, mimeType, file.getSize(),
                storageKey, visibility, actorId);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "ATTACHMENT_ADDED", "fileName", fileName)));
        ticket.audit(actorId, CatalogEventType.ATTACHMENT_ADDED, null,
                toJson(Map.of("fileName", fileName, "visibility", visibility.name())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("ATTACHMENT_ADDED", ticketId.toString(), actorId,
                        Map.of("fileName", fileName, "visibility", visibility.name()))));

        notificationService.notify(ticket.getId(), CatalogEventType.ATTACHMENT_ADDED,
                Map.of("visibility", visibility.name()));
        return attachment;
    }

    /**
     * Resolves an attachment for download, enforcing visibility against the requesting role.
     */
    @Transactional(readOnly = true)
    public Attachment findForDownload(UUID ticketId, UUID attachmentId, boolean customerView, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, customerView, actorId);
        Attachment attachment = attachmentRepository.findByIdAndTicket_Id(attachmentId, ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
        if (customerView && attachment.getVisibility() == TicketEventVisibility.INTERNAL) {
            throw new UnauthorizedOperationException("Customers cannot view internal attachments");
        }
        return attachment;
    }

    public java.nio.file.Path resolveAttachmentPath(Attachment attachment) {
        return attachmentStorage.resolve(attachment.getStorageKey());
    }

    @Transactional
    public Attachment addAttachment(UUID ticketId, AddAttachmentRequest request, String actorId,
                                    boolean isCustomer) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, isCustomer, actorId);
        if (isCustomer && request.visibility() == TicketEventVisibility.INTERNAL) {
            throw new UnauthorizedOperationException("Customers cannot upload internal attachments");
        }
        Attachment attachment = ticket.attach(request.fileName(), request.mimeType(),
                request.sizeBytes(), request.storageKey(), request.visibility(), actorId);

        ticket.recordSystemEvent(actorId, toJson(Map.of("event", "ATTACHMENT_ADDED", "fileName", request.fileName())));
        ticket.audit(actorId, CatalogEventType.ATTACHMENT_ADDED, null,
                toJson(Map.of("fileName", request.fileName(), "visibility", request.visibility().name())));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("ATTACHMENT_ADDED", ticketId.toString(), actorId,
                    Map.of("fileName", request.fileName(), "visibility", request.visibility().name())))
        );

        notificationService.notify(ticket.getId(), CatalogEventType.ATTACHMENT_ADDED,
                Map.of("visibility", request.visibility().name()));
        return attachment;
    }

    /**
     * Manager approves a SERVICE_REQUEST (Doc §2.4).
     * After approval the ticket becomes resolvable.
     */
    @Transactional
    public Ticket approveRequest(UUID ticketId, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        if (actor != TicketRole.MANAGER) {
            throw new UnauthorizedOperationException("Only managers can approve service requests");
        }
        if (!(ticket instanceof ServiceRequestTicket sr)) {
            throw new UnauthorizedOperationException("Approval is only applicable to service requests");
        }
        if (sr.getApproval().getState() != ServiceRequstApprovalStatus.PENDING) {
            throw new UnauthorizedOperationException("Request is not in PENDING state");
        }
        sr.getApproval().approve(actorId);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "APPROVAL_CHANGED", "state", "APPROVED")));
        ticket.audit(actorId, CatalogEventType.APPROVAL_CHANGED, "Request approved",
                toJson(Map.of("state", "APPROVED", "decidedBy", actorId)));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("REQUEST_APPROVED", ticketId.toString(), actorId,
                        Map.of("state", "APPROVED"))));

        notificationService.notify(ticket.getId(), CatalogEventType.APPROVAL_CHANGED,
                Map.of("state", "APPROVED"));
        return ticket;
    }

    /**
     * Manager rejects a SERVICE_REQUEST with mandatory reason (Doc §2.4).
     */
    @Transactional
    public Ticket rejectRequest(UUID ticketId, String reason, TicketRole actor, String actorId) {
        Ticket ticket = loadAndAuthorize(ticketId, actor, actorId);
        if (actor != TicketRole.MANAGER) {
            throw new UnauthorizedOperationException("Only managers can reject service requests");
        }
        if (!(ticket instanceof ServiceRequestTicket sr)) {
            throw new UnauthorizedOperationException("Approval is only applicable to service requests");
        }
        if (sr.getApproval().getState() != ServiceRequstApprovalStatus.PENDING) {
            throw new UnauthorizedOperationException("Request is not in PENDING state");
        }
        sr.getApproval().reject(actorId, reason);

        ticket.recordSystemEvent(actorId, toJson(Map.of(
                "event", "APPROVAL_CHANGED", "state", "REJECTED")));
        ticket.audit(actorId, CatalogEventType.APPROVAL_CHANGED, reason,
                toJson(Map.of("state", "REJECTED", "decidedBy", actorId, "reason", reason)));

        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
                kafkaLogProducer.publish(LogEvent.of("REQUEST_REJECTED", ticketId.toString(), actorId,
                        Map.of("state", "REJECTED", "reason", reason))));

        notificationService.notify(ticket.getId(), CatalogEventType.APPROVAL_CHANGED,
                Map.of("state", "REJECTED"));
        return ticket;
    }

    /**
     * Doc §4.4.6 — Customer submits a 1-5 rating after closure. Only the reporter may submit,
     * only after CLOSED, and only once per ticket. The assignee snapshot is captured at
     * submission time (immutable for reporting).
     */
    @Transactional
    public com.itsm.ticket.ticket.domain.TicketFeedback submitFeedback(
            UUID ticketId, SubmitFeedbackRequest request, String actorId, boolean isCustomer) {
        if (!isCustomer) {
            throw new UnauthorizedOperationException("Only customers can submit feedback");
        }
        Ticket ticket = loadOrThrow(ticketId);
        if (!actorId.equals(ticket.getReporterId())) {
            throw new UnauthorizedOperationException("Only the ticket reporter can submit feedback");
        }
        if (ticket.getStatus() != TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Feedback can only be submitted for closed tickets");
        }
        if (feedbackRepository.existsByTicketId(ticketId)) {
            throw new IllegalArgumentException("Feedback already submitted for this ticket");
        }

        com.itsm.ticket.ticket.domain.TicketFeedback feedback =
                com.itsm.ticket.ticket.domain.TicketFeedback.of(
                        ticketId, actorId, ticket.getAssigneeId(),
                        request.rating(), request.comment());
        feedbackRepository.save(feedback);

        ticket.audit(actorId, CatalogEventType.CUSTOMER_FEEDBACK, null,
                toJson(Map.of("rating", String.valueOf(request.rating()))));
        ticketRepository.save(ticket);

        withMdc(ticketId, actorId, () ->
            kafkaLogProducer.publish(LogEvent.of("CUSTOMER_FEEDBACK", ticketId.toString(), actorId,
                    Map.of("rating", String.valueOf(request.rating()),
                            "agent", ticket.getAssigneeId() != null ? ticket.getAssigneeId() : "")))
        );
        return feedback;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<com.itsm.ticket.ticket.domain.TicketFeedback> findFeedback(UUID ticketId,
                                                                                         TicketRole actor,
                                                                                         String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, actor, actorId);
        return feedbackRepository.findByTicketId(ticketId);
    }

    /** Doc §13 NFR — max page size 50. Capped here so callers can't bypass via a larger ?size param. */
    public static final int MAX_PAGE_SIZE = 50;

    @Transactional(readOnly = true)
    public List<Ticket> list(TicketRole role, String actorId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Pageable capped = capPageSize(pageable);
        return switch (role) {
            case CUSTOMER -> ticketRepository.findByReporterId(actorId, capped);
            case AGENT    -> ticketRepository.findAgentQueue(actorId, capped);
            case MANAGER  -> ticketRepository.findAll(capped).getContent();
        };
    }

    private static org.springframework.data.domain.Pageable capPageSize(org.springframework.data.domain.Pageable pageable) {
        if (pageable == null || !pageable.isPaged()) {
            return org.springframework.data.domain.PageRequest.of(0, MAX_PAGE_SIZE);
        }
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            return org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
        }
        return pageable;
    }

    /**
     * Doc §6.7 — Overtime tickets: still open (not RESOLVED/CLOSED) and the SLA clock has
     * already exceeded its deadline. The clock state may be RUNNING or PAUSED; we compute
     * the current elapsed value (which adds live ticking for RUNNING) and compare against the
     * deadline so a paused ticket whose persisted elapsed is already over the deadline shows up.
     * Manager-only — enforced at the controller layer.
     */
    @Transactional(readOnly = true)
    public List<Ticket> listOvertime() {
        return ticketRepository.findByStatusNotIn(
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED),
                org.springframework.data.domain.PageRequest.of(0, MAX_PAGE_SIZE))
                .stream()
                .filter(t -> {
                    SLAClock clock = t.getSlaClock();
                    if (clock == null || clock.getDeadline() <= 0) return false;
                    return t.currentElapsedSeconds() > clock.getDeadline();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketEvent> getTimeline(UUID ticketId, boolean customerView, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, customerView, actorId);
        if (customerView) {
            return ticketEventRepository.findByTicket_IdAndVisibilityOrderByOccurredAtAsc(
                    ticketId, TicketEventVisibility.EXTERNAL);
        }
        return ticketEventRepository.findByTicket_IdOrderByOccurredAtAsc(ticketId);
    }

    @Transactional(readOnly = true)
    public List<Attachment> getAttachments(UUID ticketId, boolean customerView, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, customerView, actorId);
        if (customerView) {
            return attachmentRepository.findByTicket_IdAndVisibilityOrderByUploadedAtDesc(
                    ticketId, TicketEventVisibility.EXTERNAL);
        }
        return attachmentRepository.findByTicket_IdOrderByUploadedAtDesc(ticketId);
    }

    @Transactional(readOnly = true)
    public Ticket getById(UUID ticketId, TicketRole actor, String actorId) {
        return loadAndAuthorize(ticketId, actor, actorId);
    }

    private Ticket loadOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
    }

    private Ticket loadAndAuthorize(UUID ticketId, TicketRole actor, String actorId) {
        Ticket ticket = loadOrThrow(ticketId);
        enforceCustomerOwnership(ticket, actor, actorId);
        return ticket;
    }

    private String toJson(Map<String, String> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private void withMdc(UUID ticketId, String actor, Runnable action) {
        MDC.put("ticketId", ticketId.toString());
        MDC.put("actor", actor);
        try {
            action.run();
        } finally {
            MDC.remove("ticketId");
            MDC.remove("actor");
        }
    }

    /**
     * Customer'ın bir ticket'a erişme yetkisi var mı kontrol eder. Reporter olmayan customer
     * 403 alır — cross-tenant veri sızıntısının son hattı.
     */
    private void enforceCustomerOwnership(Ticket ticket, TicketRole actor, String actorId) {
        if (actor == TicketRole.CUSTOMER && !actorId.equals(ticket.getReporterId())) {
            throw new UnauthorizedOperationException("You can only access your own tickets");
        }
    }

    private void enforceCustomerOwnership(Ticket ticket, boolean isCustomer, String actorId) {
        if (isCustomer && !actorId.equals(ticket.getReporterId())) {
            throw new UnauthorizedOperationException("You can only access your own tickets");
        }
    }
}
