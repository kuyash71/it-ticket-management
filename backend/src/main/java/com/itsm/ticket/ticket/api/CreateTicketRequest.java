package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTicketRequest(
        @NotNull TicketType type,
        @NotBlank String title,
        @NotBlank String description
) {
}
