package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketType;

public interface SLADeadlineCalculationPolicy {
    long calculate(
        TicketType type,
        TicketPriority priority
    );
}
