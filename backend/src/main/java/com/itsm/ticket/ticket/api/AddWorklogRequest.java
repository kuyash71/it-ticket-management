package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request body for an internal worklog entry. */
public record AddWorklogRequest(
        @NotBlank @Size(max = 10000) String body,
        @NotNull TicketEventVisibility visibility
) {}
