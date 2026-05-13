package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.ResolutionCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveTicketRequest(
        @NotBlank @Size(max = 4000) String resolutionNote,
        @NotNull ResolutionCode resolutionCode
) {}
