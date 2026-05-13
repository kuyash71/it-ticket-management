package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.ServiceRequestTicket;
import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;
import com.itsm.ticket.ticket.domain.enums.TicketAction;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.policy.AllowedActionsService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        String type,
        String title,
        String description,
        String status,
        String priority,
        String impact,
        String urgency,
        String assigneeId,
        String resolutionNote,
        Instant resolvedAt,
        String closeReason,
        Instant closedAt,
        String approvalState,
        List<String> allowedActions,
        Instant createdAt,
        Instant updatedAt,
        SlaInfo sla
) {
    private static final AllowedActionsService ACTIONS = new AllowedActionsService();

    /** SLA snapshot for the UI (Doc §3.2.1 countdown timer, §6.7 escalation). */
    public record SlaInfo(
            long elapsedSeconds,
            long deadlineSeconds,
            long remainingSeconds,
            int progressPercent,
            String level,        // NORMAL / WARNING / RISK / BREACH
            String clockState    // RUNNING / PAUSED / STOPPED
    ) {}

    public static TicketResponse from(Ticket ticket) {
        return from(ticket, null);
    }

    public static TicketResponse from(Ticket ticket, TicketRole role) {
        List<String> actions = role == null
                ? List.of()
                : ACTIONS.compute(ticket, role).stream().map(TicketAction::name).toList();

        String approvalState = null;
        if (ticket instanceof ServiceRequestTicket sr && sr.getApproval() != null) {
            approvalState = sr.getApproval().getState().name();
        }

        return new TicketResponse(
                ticket.getId(),
                ticket.getType().name(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus().name(),
                ticket.getPriority().name(),
                ticket.getImpact().name(),
                ticket.getUrgency().name(),
                ticket.getAssigneeId(),
                ticket.getResolutionNote(),
                ticket.getResolvedAt(),
                ticket.getCloseReason(),
                ticket.getClosedAt(),
                approvalState,
                actions,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                buildSla(ticket)
        );
    }

    private static SlaInfo buildSla(Ticket ticket) {
        if (ticket.getSlaClock() == null) return null;
        long elapsed = ticket.currentElapsedSeconds();
        long deadline = ticket.getSlaClock().getDeadline();
        long remaining = deadline - elapsed;
        int percent = deadline > 0
                ? (int) Math.min(999, Math.max(0, Math.round(elapsed * 100.0 / deadline)))
                : 0;
        SLAEscalationLevel level = ticket.getSlaLevel() != null
                ? ticket.getSlaLevel()
                : SLAEscalationLevel.NORMAL;
        String clockState = ticket.getSlaClock().getState() != null
                ? ticket.getSlaClock().getState().name()
                : "STOPPED";
        return new SlaInfo(elapsed, deadline, remaining, percent, level.name(), clockState);
    }
}
