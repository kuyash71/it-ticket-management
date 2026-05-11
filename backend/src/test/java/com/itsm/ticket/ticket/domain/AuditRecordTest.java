package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuditRecordTest {

    private final Ticket ticket = new IncidentTicket("Network issue", "Can't reach server");

    @Test
    void audit_ticketCreated_shouldSucceed() {
        AuditRecord record = ticket.audit("user-1", CatalogEventType.TICKET_CREATED,
                null, "{\"type\":\"INCIDENT\"}");

        assertNotNull(record.getId());
        assertEquals(CatalogEventType.TICKET_CREATED, record.getAction());
        assertEquals("user-1", record.getActorId());
        assertNull(record.getReason());
        assertEquals(1, ticket.getAuditRecords().size());
    }

    @Test
    void audit_statusChanged_shouldRecordFromTo() {
        AuditRecord record = ticket.audit("agent-1", CatalogEventType.STATUS_CHANGED,
                null, "{\"from\":\"NEW\",\"to\":\"IN_PROGRESS\"}");

        assertEquals("{\"from\":\"NEW\",\"to\":\"IN_PROGRESS\"}", record.getDetail());
    }

    @Test
    void audit_managerOverride_withReason_shouldSucceed() {
        AuditRecord record = ticket.audit("manager-1", CatalogEventType.MANAGER_OVERRIDE,
                "SLA breach imminent", "{\"override\":\"priority\"}");

        assertEquals("SLA breach imminent", record.getReason());
        assertEquals(CatalogEventType.MANAGER_OVERRIDE, record.getAction());
    }

    @Test
    void audit_managerOverride_withoutReason_shouldThrow() {
        assertThrows(IllegalArgumentException.class, () ->
                ticket.audit("manager-1", CatalogEventType.MANAGER_OVERRIDE,
                        null, "{}"));
    }

    @Test
    void audit_managerOverride_withBlankReason_shouldThrow() {
        assertThrows(IllegalArgumentException.class, () ->
                ticket.audit("manager-1", CatalogEventType.MANAGER_OVERRIDE,
                        "   ", "{}"));
    }

    @Test
    void audit_multipleRecords_shouldAllBeSaved() {
        ticket.audit("user-1", CatalogEventType.TICKET_CREATED, null, "{}");
        ticket.audit("agent-1", CatalogEventType.STATUS_CHANGED, null, "{}");
        ticket.audit("agent-1", CatalogEventType.PRIORITY_CHANGED, null, "{}");

        assertEquals(3, ticket.getAuditRecords().size());
    }
}
