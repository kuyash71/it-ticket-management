package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.TicketEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TicketEventThreadingTest {

    private Ticket ticket;

    @BeforeEach
    void setUp() {
        ticket = new IncidentTicket("VPN issue", "Cannot connect");
    }

    @Test
    void addComment_withNoParent_shouldSucceed() {
        TicketEvent event = ticket.addComment("user-1", "Initial comment",
                TicketEventVisibility.EXTERNAL, null);

        assertNotNull(event.getId());
        assertEquals(TicketEventType.COMMENT, event.getEventType());
        assertNull(event.getParentId());
        assertEquals(1, ticket.getEvents().size());
    }

    @Test
    void addComment_replyToComment_shouldSucceed() {
        TicketEvent parent = ticket.addComment("agent-1", "What is the error?",
                TicketEventVisibility.EXTERNAL, null);

        TicketEvent reply = ticket.addComment("user-1", "Error 502",
                TicketEventVisibility.EXTERNAL, parent.getId());

        assertEquals(parent.getId(), reply.getParentId());
        assertEquals(2, ticket.getEvents().size());
    }

    @Test
    void addComment_deepThreading_shouldSucceed() {
        TicketEvent root = ticket.addComment("user-1", "root",
                TicketEventVisibility.EXTERNAL, null);
        TicketEvent level1 = ticket.addComment("agent-1", "level 1",
                TicketEventVisibility.EXTERNAL, root.getId());
        TicketEvent level2 = ticket.addComment("user-1", "level 2",
                TicketEventVisibility.EXTERNAL, level1.getId());

        assertEquals(root.getId(), level1.getParentId());
        assertEquals(level1.getId(), level2.getParentId());
        assertEquals(3, ticket.getEvents().size());
    }

    @Test
    void addComment_internalReplyToExternalComment_shouldSucceed() {
        TicketEvent external = ticket.addComment("user-1", "Customer message",
                TicketEventVisibility.EXTERNAL, null);

        TicketEvent internal = ticket.addComment("agent-1", "Internal note about this",
                TicketEventVisibility.INTERNAL, external.getId());

        assertEquals(TicketEventVisibility.INTERNAL, internal.getVisibility());
        assertEquals(external.getId(), internal.getParentId());
    }

    @Test
    void addComment_replyToSystemEvent_shouldThrow() {
        TicketEvent systemEvent = ticket.recordSystemEvent("SYSTEM", "{\"event\":\"STATUS_CHANGED\"}");

        assertThrows(IllegalArgumentException.class,
                () -> ticket.addComment("user-1", "reply to system",
                        TicketEventVisibility.EXTERNAL, systemEvent.getId()));
    }

    @Test
    void addComment_replyToWorklog_shouldThrow() {
        TicketEvent worklog = ticket.addWorklog("agent-1", "Investigated logs",
                TicketEventVisibility.INTERNAL);

        assertThrows(IllegalArgumentException.class,
                () -> ticket.addComment("user-1", "reply to worklog",
                        TicketEventVisibility.EXTERNAL, worklog.getId()));
    }

    @Test
    void addComment_nonExistentParentId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> ticket.addComment("user-1", "orphan reply",
                        TicketEventVisibility.EXTERNAL, UUID.randomUUID()));
    }

    @Test
    void addWorklog_withoutParent_shouldSucceed() {
        TicketEvent worklog = ticket.addWorklog("agent-1", "Checked firewall rules",
                TicketEventVisibility.INTERNAL);

        assertEquals(TicketEventType.WORKLOG, worklog.getEventType());
        assertEquals(TicketEventVisibility.INTERNAL, worklog.getVisibility());
        assertNull(worklog.getParentId());
    }

    @Test
    void recordSystemEvent_shouldAlwaysBeExternal() {
        TicketEvent event = ticket.recordSystemEvent("SYSTEM", "{\"event\":\"TICKET_CREATED\"}");

        assertEquals(TicketEventType.SYSTEM_EVENT, event.getEventType());
        assertEquals(TicketEventVisibility.EXTERNAL, event.getVisibility());
    }
}
