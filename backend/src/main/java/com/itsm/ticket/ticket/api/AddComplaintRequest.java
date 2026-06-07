package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Doc §7.8 — Customer-initiated service quality complaint payload.
 */
public record AddComplaintRequest(
        @NotBlank @Size(max = 4000) String body
) {}
