package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddAttachmentRequest(
        @NotBlank String fileName,
        @NotBlank String mimeType,
        @Positive long sizeBytes,
        @NotBlank String storageKey,
        @NotNull TicketEventVisibility visibility
) {}
