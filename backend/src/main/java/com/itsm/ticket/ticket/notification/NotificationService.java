package com.itsm.ticket.ticket.notification;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.UUID;

/**
 * Logs an outbound notification line whenever {@link NotificationRule} permits the event.
 * The actual transport (mail, webhook, push) is out of scope; this acts as a hook point.
 * When called inside an active transaction, dispatch is deferred to {@code afterCommit}.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRule rule = new NotificationRule();

    /** Queues a notification; no-op when the policy rejects the event. */
    public void notify(UUID ticketId, CatalogEventType eventType, Map<String, Object> context) {
        if (!rule.shouldNotify(eventType, context)) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatch(ticketId, eventType, context);
                }
            });
            return;
        }
        dispatch(ticketId, eventType, context);
    }

    private void dispatch(UUID ticketId, CatalogEventType eventType, Map<String, Object> context) {
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
