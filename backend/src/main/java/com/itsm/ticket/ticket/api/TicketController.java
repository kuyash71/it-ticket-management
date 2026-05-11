package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

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
    public List<TicketResponse> listTickets() {
        return ticketService.list().stream()
                .map(TicketResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse createTicket(@Valid @RequestBody CreateTicketRequest request,
                                       Authentication auth) {
        return TicketResponse.from(ticketService.create(request, auth.getName()));
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TimelineEventResponse addComment(@PathVariable UUID id,
                                            @Valid @RequestBody AddCommentRequest request,
                                            Authentication auth) {
        return TimelineEventResponse.from(ticketService.addComment(id, request, auth.getName()));
    }

    @PostMapping("/{id}/worklogs")
    @ResponseStatus(HttpStatus.CREATED)
    public TimelineEventResponse addWorklog(@PathVariable UUID id,
                                            @Valid @RequestBody AddWorklogRequest request,
                                            Authentication auth) {
        return TimelineEventResponse.from(ticketService.addWorklog(id, request, auth.getName()));
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEventResponse> getTimeline(@PathVariable UUID id, Authentication auth) {
        boolean customerView = isCustomer(auth);
        return ticketService.getTimeline(id, customerView).stream()
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

    @GetMapping("/{id}/attachments")
    public List<AttachmentResponse> listAttachments(@PathVariable UUID id, Authentication auth) {
        boolean customerView = isCustomer(auth);
        return ticketService.getAttachments(id, customerView).stream()
                .map(AttachmentResponse::from)
                .toList();
    }

    private boolean isCustomer(Authentication auth) {
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return !authorities.contains("ROLE_MANAGER") && !authorities.contains("ROLE_AGENT");
    }
}
