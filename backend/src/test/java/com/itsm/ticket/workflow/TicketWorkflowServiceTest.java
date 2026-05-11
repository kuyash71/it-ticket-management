package com.itsm.ticket.workflow;

import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.bean.MockBean;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class TicketWorkflowServiceTest {

    @Autowired
    private TicketWorkflowService workflowService;

    @MockBean
    private TicketRepository ticketRepository;

    @MockBean
    private KafkaLogProducer kafkaLogProducer;

    @Test
    void incidentLifecycle_shouldReturnProcessInstanceId() {
        String id = workflowService.startTicketLifecycle(Map.of(
                "ticketId", UUID.randomUUID().toString(),
                "ticketType", TicketType.INCIDENT.name(),
                "ticketStatus", "NEW"
        ));

        assertNotNull(id);
        assertFalse(id.isBlank());
    }

    @Test
    void serviceRequestLifecycle_shouldReturnProcessInstanceId() {
        String id = workflowService.startTicketLifecycle(Map.of(
                "ticketId", UUID.randomUUID().toString(),
                "ticketType", TicketType.SERVICE_REQUEST.name(),
                "ticketStatus", "NEW"
        ));

        assertNotNull(id);
        assertFalse(id.isBlank());
    }

    @Test
    void unknownTicketType_shouldThrowException() {
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalStateException.class,
                () -> workflowService.startTicketLifecycle(Map.of(
                        "ticketId", UUID.randomUUID().toString(),
                        "ticketType", "UNKNOWN",
                        "ticketStatus", "NEW"
                ))
        );
    }
}
