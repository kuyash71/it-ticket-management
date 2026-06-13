package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketType;

import java.util.HashMap;
import java.util.Map;

/** Static SLA deadline matrix in seconds, keyed by (type, priority). Values from Doc §6.2. */
public class SLADeadlineService implements SLADeadlineCalculationPolicy {
    private final Map<DeadlineKey, Long> matrix;

    public SLADeadlineService() {
        matrix = new HashMap<>();

        matrix.put(new DeadlineKey(TicketType.INCIDENT, TicketPriority.CRITICAL), 14400L);
        matrix.put(new DeadlineKey(TicketType.INCIDENT, TicketPriority.HIGH),     28800L);
        matrix.put(new DeadlineKey(TicketType.INCIDENT, TicketPriority.MEDIUM),   86400L);
        matrix.put(new DeadlineKey(TicketType.INCIDENT, TicketPriority.LOW),     172800L);

        matrix.put(new DeadlineKey(TicketType.SERVICE_REQUEST, TicketPriority.CRITICAL), 28800L);
        matrix.put(new DeadlineKey(TicketType.SERVICE_REQUEST, TicketPriority.HIGH),     86400L);
        matrix.put(new DeadlineKey(TicketType.SERVICE_REQUEST, TicketPriority.MEDIUM),  259200L);
        matrix.put(new DeadlineKey(TicketType.SERVICE_REQUEST, TicketPriority.LOW),     432000L);
    }

    @Override
    public long calculate(TicketType type, TicketPriority priority) {
        Long result = matrix.get(new DeadlineKey(type, priority));
        if (result == null) {
            throw new IllegalStateException("No SLA defined for: " + type + ", " + priority);
        }
        return result;
    }
}
