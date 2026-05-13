package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveTicketRequest(
        @NotBlank @Size(max = 4000) String resolutionNote
) {}
