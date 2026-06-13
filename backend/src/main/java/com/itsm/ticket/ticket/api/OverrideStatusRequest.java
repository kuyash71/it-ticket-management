package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request body for manager status override. Reason mandatory. */
public record OverrideStatusRequest(
        @NotNull TicketStatus targetStatus,
        @NotBlank @Size(max = 4000) String reason
) {}
