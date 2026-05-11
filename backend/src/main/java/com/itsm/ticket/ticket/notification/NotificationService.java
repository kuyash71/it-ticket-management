package com.itsm.ticket.ticket.notification;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRule rule = new NotificationRule();

    public void notify(UUID ticketId, CatalogEventType eventType, Map<String, Object> context) {
        if (!rule.shouldNotify(eventType, context)) return;

        String recipient = resolveRecipient(eventType, context);
        log.info("NOTIFICATION event={} ticketId={} recipient={} context={}",
                eventType, ticketId, recipient, context);
    }

    private String resolveRecipient(CatalogEventType eventType, Map<String, Object> context) {
        return switch (eventType) {
            case SLA_BREACH_RISK, SLA_BREACHED, MANAGER_OVERRIDE -> "MANAGER";
            case STATUS_CHANGED, ATTACHMENT_ADDED -> "CUSTOMER";
            case TICKET_CREATED -> (String) context.getOrDefault("assignedTo", "AGENT");
            default -> "SYSTEM";
        };
    }
}
