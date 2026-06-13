package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for manager reassignment. Reason mandatory. */
public record ReassignRequest(
        @NotBlank @Size(max = 255) String assignee,
        @NotBlank @Size(max = 1000) String reason
) {}
