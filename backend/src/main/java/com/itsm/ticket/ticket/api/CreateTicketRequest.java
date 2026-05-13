package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateTicketRequest(
        @NotNull TicketType type,
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 5000) String description,
        /** Customer-perceived urgency (Doc §6.2). Optional — defaults to LOW. */
        TicketUrgency urgency,
        @Valid List<AttachmentInput> attachments
) {

    public record AttachmentInput(
            @NotBlank @Size(max = 255) String fileName,
            @NotBlank @Size(max = 127) String mimeType,
            @Positive long sizeBytes,
            @NotBlank @Size(max = 512) String storageKey,
            @NotNull TicketEventVisibility visibility
    ) {}
}
