package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequestRequest(
        @NotBlank @Size(max = 2000) String reason
) {}
