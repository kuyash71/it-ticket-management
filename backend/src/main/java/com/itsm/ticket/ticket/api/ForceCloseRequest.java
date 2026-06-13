package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for manager force-close. Reason mandatory. */
public record ForceCloseRequest(
        @NotBlank @Size(max = 4000) String reason
) {}
