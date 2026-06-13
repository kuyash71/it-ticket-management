package com.itsm.ticket.ticket.notification;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;

import java.util.Map;

/** Decides whether an event should produce an outbound notification (Doc §10). */
public class NotificationRule {

    private static final java.util.Set<TicketStatus> CUSTOMER_FACING_STATUSES =
            java.util.Set.of(TicketStatus.RESOLVED, TicketStatus.WAITING_FOR_CUSTOMER, TicketStatus.CLOSED);

    public boolean shouldNotify(CatalogEventType eventType, Map<String, Object> context) {
        return switch (eventType) {
            case SLA_BREACH_RISK, SLA_BREACHED -> true;
            case STATUS_CHANGED -> isCustomerFacing((String) context.get("newStatus"));
            case ATTACHMENT_ADDED -> TicketEventVisibility.EXTERNAL.name()
                    .equals(context.get("visibility"));
            case TICKET_CREATED -> context.containsKey("assignedTo");
            default -> false;
        };
    }

    private boolean isCustomerFacing(String status) {
        if (status == null) return false;
        try {
            return CUSTOMER_FACING_STATUSES.contains(TicketStatus.valueOf(status));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
