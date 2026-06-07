package com.itsm.ticket.ticket.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Doc §4.4.6 — Customer feedback after closure. Rating 1-5 plus optional comment.
 */
public record SubmitFeedbackRequest(
        @Min(1) @Max(5) int rating,
        @Size(max = 4000) String comment
) {}
