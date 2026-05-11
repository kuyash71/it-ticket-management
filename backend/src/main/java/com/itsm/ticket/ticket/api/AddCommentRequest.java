package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCommentRequest(
        @NotBlank String body,
        @NotNull TicketEventVisibility visibility,
        UUID parentId
) {}
