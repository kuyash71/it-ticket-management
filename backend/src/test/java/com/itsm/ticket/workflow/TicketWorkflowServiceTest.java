package com.itsm.ticket.workflow;

import com.itsm.ticket.ticket.domain.enums.TicketType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kie.kogito.Model;
import org.kie.kogito.process.ProcessInstance;
import org.kie.kogito.process.Processes;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketWorkflowServiceTest {

    @Mock
    private Processes processes;

    @InjectMocks
    private TicketWorkflowService workflowService;

    @SuppressWarnings({"unchecked", "rawtypes"})
    private org.kie.kogito.process.Process buildMockProcess(String instanceId) {
        ProcessInstance instance = mock(ProcessInstance.class);
        when(instance.id()).thenReturn(instanceId);

        org.kie.kogito.process.Process process = mock(org.kie.kogito.process.Process.class, inv -> {
            String method = inv.getMethod().getName();
            if ("createModel".equals(method)) return mock(Model.class);
            if ("createInstance".equals(method)) return instance;
            return null;
        });
        return process;
    }

    @Test
    @SuppressWarnings("rawtypes")
    void incidentLifecycle_shouldReturnProcessInstanceId() {
        String expectedId = UUID.randomUUID().toString();
        org.kie.kogito.process.Process proc = buildMockProcess(expectedId);
        doReturn(proc).when(processes).processById("itsm.incident.lifecycle");

        String id = workflowService.startTicketLifecycle(Map.of(
                "ticketId", UUID.randomUUID().toString(),
                "ticketType", TicketType.INCIDENT.name(),
                "ticketStatus", "NEW"
        ));

        assertNotNull(id);
        assertEquals(expectedId, id);
    }

    @Test
    @SuppressWarnings("rawtypes")
    void serviceRequestLifecycle_shouldReturnProcessInstanceId() {
        String expectedId = UUID.randomUUID().toString();
        org.kie.kogito.process.Process proc = buildMockProcess(expectedId);
        doReturn(proc).when(processes).processById("itsm.service-request.lifecycle");

        String id = workflowService.startTicketLifecycle(Map.of(
                "ticketId", UUID.randomUUID().toString(),
                "ticketType", TicketType.SERVICE_REQUEST.name(),
                "ticketStatus", "NEW"
        ));

        assertNotNull(id);
        assertEquals(expectedId, id);
    }

    @Test
    void unknownTicketType_shouldThrowException() {
        assertThrows(
                IllegalStateException.class,
                () -> workflowService.startTicketLifecycle(Map.of(
                        "ticketId", UUID.randomUUID().toString(),
                        "ticketType", "UNKNOWN",
                        "ticketStatus", "NEW"
                ))
        );
    }
}
