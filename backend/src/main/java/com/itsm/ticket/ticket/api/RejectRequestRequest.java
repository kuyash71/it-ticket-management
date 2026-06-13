package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for rejecting a service request. Reason mandatory. */
public record RejectRequestRequest(
        @NotBlank @Size(max = 2000) String reason
) {}
