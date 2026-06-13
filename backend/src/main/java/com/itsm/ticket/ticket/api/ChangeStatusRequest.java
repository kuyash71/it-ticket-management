package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

/** Request body for a plain status transition. */
public record ChangeStatusRequest(@NotNull TicketStatus status) {}
