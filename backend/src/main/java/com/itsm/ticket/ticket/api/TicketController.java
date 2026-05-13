package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.Attachment;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public List<TicketResponse> listTickets(Authentication auth) {
        TicketRole role = resolveRole(auth);
        return ticketService.list(role, auth.getName()).stream()
                .map(t -> TicketResponse.from(t, role))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse createTicket(@Valid @RequestBody CreateTicketRequest request,
                                       Authentication auth) {
        return TicketResponse.from(ticketService.create(request, auth.getName()), resolveRole(auth));
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TimelineEventResponse addComment(@PathVariable UUID id,
                                            @Valid @RequestBody AddCommentRequest request,
                                            Authentication auth) {
        return TimelineEventResponse.from(
                ticketService.addComment(id, request, auth.getName(), isCustomer(auth)));
    }

    @PostMapping("/{id}/worklogs")
    @ResponseStatus(HttpStatus.CREATED)
    public TimelineEventResponse addWorklog(@PathVariable UUID id,
                                            @Valid @RequestBody AddWorklogRequest request,
                                            Authentication auth) {
        return TimelineEventResponse.from(ticketService.addWorklog(id, request, auth.getName(), isCustomer(auth)));
    }

    @PatchMapping("/{id}/status")
    public TicketResponse changeStatus(@PathVariable UUID id,
                                       @Valid @RequestBody ChangeStatusRequest request,
                                       Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.changeStatus(id, request.status(), role, auth.getName()), role);
    }

    /**
     * Doc §4.1 — RESOLVED requires resolution note.
     */
    @PostMapping("/{id}/resolve")
    public TicketResponse resolveTicket(@PathVariable UUID id,
                                        @Valid @RequestBody ResolveTicketRequest request,
                                        Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.resolve(id, request.resolutionNote(), request.resolutionCode(), role, auth.getName()), role);
    }

    /**
     * Doc §4.1 — Customer confirms closure of a RESOLVED ticket.
     */
    @PostMapping("/{id}/confirm-close")
    public TicketResponse confirmClose(@PathVariable UUID id, Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.confirmClose(id, role, auth.getName()), role);
    }

    /**
     * Doc §9 — Manager force-close with reason (audit zorunlu).
     */
    @PostMapping("/{id}/force-close")
    public TicketResponse forceClose(@PathVariable UUID id,
                                     @Valid @RequestBody ForceCloseRequest request,
                                     Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.forceClose(id, request.reason(), role, auth.getName()), role);
    }

    /**
     * Doc §3.2 — Priority change with reason (audit zorunlu).
     */
    @PatchMapping("/{id}/priority")
    public TicketResponse changePriority(@PathVariable UUID id,
                                         @Valid @RequestBody ChangePriorityRequest request,
                                         Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.changePriority(id, request, role, auth.getName()), role);
    }

    /**
     * Doc §5.4.3 — Manager-only status override with reason (bypasses transition policy).
     */
    @PostMapping("/{id}/override-status")
    public TicketResponse overrideStatus(@PathVariable UUID id,
                                         @Valid @RequestBody OverrideStatusRequest request,
                                         Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.overrideStatus(id, request.targetStatus(), request.reason(),
                        role, auth.getName()), role);
    }

    /**
     * Doc §11 — Agent self-assigns a NEW ticket (TAKE_OWNERSHIP).
     */
    @PostMapping("/{id}/take-ownership")
    public TicketResponse takeOwnership(@PathVariable UUID id, Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.takeOwnership(id, role, auth.getName()), role);
    }

    /**
     * Doc §9 — Manager reassigns to another agent with reason (audit zorunlu).
     */
    @PostMapping("/{id}/reassign")
    public TicketResponse reassign(@PathVariable UUID id,
                                   @Valid @RequestBody ReassignRequest request,
                                   Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.reassign(id, request.assignee(), request.reason(),
                        role, auth.getName()), role);
    }

    /**
     * Doc §2.4 — Manager approves a service request (no body needed).
     */
    @PostMapping("/{id}/approve")
    public TicketResponse approveRequest(@PathVariable UUID id, Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.approveRequest(id, role, auth.getName()), role);
    }

    /**
     * Doc §2.4 — Manager rejects a service request with mandatory reason.
     */
    @PostMapping("/{id}/reject")
    public TicketResponse rejectRequest(@PathVariable UUID id,
                                        @Valid @RequestBody RejectRequestRequest request,
                                        Authentication auth) {
        TicketRole role = resolveRole(auth);
        return TicketResponse.from(
                ticketService.rejectRequest(id, request.reason(), role, auth.getName()), role);
    }

    @GetMapping("/{id}")
    public TicketResponse getTicket(@PathVariable UUID id, Authentication auth) {
        return TicketResponse.from(ticketService.getById(id), resolveRole(auth));
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEventResponse> getTimeline(@PathVariable UUID id, Authentication auth) {
        return ticketService.getTimeline(id, isCustomer(auth)).stream()
                .map(TimelineEventResponse::from)
                .toList();
    }

    @PostMapping("/{id}/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse addAttachment(@PathVariable UUID id,
                                            @Valid @RequestBody AddAttachmentRequest request,
                                            Authentication auth) {
        return AttachmentResponse.from(ticketService.addAttachment(id, request, auth.getName()));
    }

    /**
     * Multipart file upload (Doc §9). Persists the bytes to disk and creates the Attachment record
     * with audit+event in one transaction.
     */
    @PostMapping(value = "/{id}/attachments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse uploadAttachment(@PathVariable UUID id,
                                               @RequestParam("file") MultipartFile file,
                                               @RequestParam(value = "visibility", defaultValue = "EXTERNAL") TicketEventVisibility visibility,
                                               Authentication auth) {
        return AttachmentResponse.from(
                ticketService.uploadAttachment(id, file, visibility, auth.getName()));
    }

    @GetMapping("/{id}/attachments")
    public List<AttachmentResponse> listAttachments(@PathVariable UUID id, Authentication auth) {
        return ticketService.getAttachments(id, isCustomer(auth)).stream()
                .map(AttachmentResponse::from)
                .toList();
    }

    /**
     * Download endpoint. Enforces visibility for customers (Doc §9.4).
     */
    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id,
                                                       @PathVariable UUID attachmentId,
                                                       Authentication auth) {
        Attachment attachment = ticketService.findForDownload(id, attachmentId, isCustomer(auth));
        Resource resource = new FileSystemResource(ticketService.resolveAttachmentPath(attachment));
        String encoded = URLEncoder.encode(attachment.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encoded)
                .body(resource);
    }

    private boolean isCustomer(Authentication auth) {
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return !authorities.contains("ROLE_MANAGER") && !authorities.contains("ROLE_AGENT");
    }

    private TicketRole resolveRole(Authentication auth) {
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        if (authorities.contains("ROLE_MANAGER")) return TicketRole.MANAGER;
        if (authorities.contains("ROLE_AGENT")) return TicketRole.AGENT;
        return TicketRole.CUSTOMER;
    }
}
