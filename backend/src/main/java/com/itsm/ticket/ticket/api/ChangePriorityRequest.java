package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketImpact;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePriorityRequest(
        TicketImpact impact,
        TicketUrgency urgency,
        @NotBlank @Size(max = 1000) String reason
) {}
