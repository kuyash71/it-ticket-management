package com.itsm.ticket.workflow;

import com.itsm.ticket.ticket.domain.enums.TicketType;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class TicketWorkflowServiceTest {

    @Test
  void incidentLifecycle_shouldReturnProcessInstanceId() {
      var service = new TicketWorkflowService();
      long id = service.startTicketLifecycle(Map.of(
          "ticketId", UUID.randomUUID().toString(),
          "ticketType", TicketType.INCIDENT.name(),
          "status", "NEW"
      ));
      assertTrue(id > 0);
  }
}
