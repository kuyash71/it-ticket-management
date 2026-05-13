package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(@NotNull TicketStatus status) {}
