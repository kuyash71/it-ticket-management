package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Request body for attaching metadata for a pre-stored object. */
public record AddAttachmentRequest(
        @NotBlank @Size(max = 255) String fileName,
        @NotBlank @Size(max = 127) String mimeType,
        @Positive long sizeBytes,
        @NotBlank @Size(max = 512) String storageKey,
        @NotNull TicketEventVisibility visibility
) {}
