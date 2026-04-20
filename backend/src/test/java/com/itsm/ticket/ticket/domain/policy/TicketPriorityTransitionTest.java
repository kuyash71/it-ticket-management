package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.TicketImpact;
import com.itsm.ticket.ticket.domain.enums.TicketPriority;
import com.itsm.ticket.ticket.domain.enums.TicketUrgency;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class TicketPriorityTransitionTest {

    private final TicketPriorityTransition policy = new TicketPriorityTransition();

  @Test
  void lowImpactLowUrgency_shouldReturnLow() {
      assertEquals(TicketPriority.LOW, policy.calculate(TicketImpact.LOW, TicketUrgency.LOW));
  }

  @Test
  void highImpactHighUrgency_shouldReturnCritical() {
      assertEquals(TicketPriority.CRITICAL, policy.calculate(TicketImpact.HIGH, TicketUrgency.HIGH));
  }

}
