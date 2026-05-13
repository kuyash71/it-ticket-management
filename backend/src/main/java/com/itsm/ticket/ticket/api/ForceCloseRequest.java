package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForceCloseRequest(
        @NotBlank @Size(max = 4000) String reason
) {}
