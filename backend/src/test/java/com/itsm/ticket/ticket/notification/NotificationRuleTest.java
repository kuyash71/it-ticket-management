package com.itsm.ticket.ticket.notification;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class NotificationRuleTest {

    private final NotificationRule rule = new NotificationRule();

    @Test
    void slaBreachRisk_shouldAlwaysNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.SLA_BREACH_RISK, Map.of()));
    }

    @Test
    void slaBreached_shouldAlwaysNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.SLA_BREACHED, Map.of()));
    }

    @Test
    void statusChanged_toResolved_shouldNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", "RESOLVED")));
    }

    @Test
    void statusChanged_toWaitingForCustomer_shouldNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", "WAITING_FOR_CUSTOMER")));
    }

    @Test
    void statusChanged_toClosed_shouldNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", "CLOSED")));
    }

    @Test
    void statusChanged_toInProgress_shouldNotNotify() {
        assertFalse(rule.shouldNotify(CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", "IN_PROGRESS")));
    }

    @Test
    void statusChanged_toNew_shouldNotNotify() {
        assertFalse(rule.shouldNotify(CatalogEventType.STATUS_CHANGED,
                Map.of("newStatus", "NEW")));
    }

    @Test
    void attachmentAdded_external_shouldNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.ATTACHMENT_ADDED,
                Map.of("visibility", TicketEventVisibility.EXTERNAL.name())));
    }

    @Test
    void attachmentAdded_internal_shouldNotNotify() {
        assertFalse(rule.shouldNotify(CatalogEventType.ATTACHMENT_ADDED,
                Map.of("visibility", TicketEventVisibility.INTERNAL.name())));
    }

    @Test
    void ticketCreated_withAssignment_shouldNotify() {
        assertTrue(rule.shouldNotify(CatalogEventType.TICKET_CREATED,
                Map.of("assignedTo", "agent-42")));
    }

    @Test
    void ticketCreated_withoutAssignment_shouldNotNotify() {
        assertFalse(rule.shouldNotify(CatalogEventType.TICKET_CREATED, Map.of()));
    }

    @Test
    void worklogAdded_shouldNotNotify() {
        assertFalse(rule.shouldNotify(CatalogEventType.WORKLOG_ADDED, Map.of()));
    }
}
