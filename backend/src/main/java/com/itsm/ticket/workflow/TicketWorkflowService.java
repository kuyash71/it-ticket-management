package com.itsm.ticket.workflow;

import com.itsm.ticket.ticket.domain.enums.TicketType;
import org.kie.kogito.process.ProcessInstance;
import org.kie.kogito.process.Processes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class TicketWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(TicketWorkflowService.class);

    @Autowired(required = false)
    private Processes processes;

    public String startTicketLifecycle(Map<String, Object> variables) {
        if (processes == null) {
            String fallbackId = UUID.randomUUID().toString();
            log.warn("Kogito Processes bean not available — workflow engine disabled. Ticket will run without process tracking (instanceId={})", fallbackId);
            return fallbackId;
        }

        String ticketType = (String) variables.get("ticketType");

        String processId;
        if (TicketType.INCIDENT.name().equals(ticketType)) {
            processId = "itsm.incident.lifecycle";
        } else if (TicketType.SERVICE_REQUEST.name().equals(ticketType)) {
            processId = "itsm.service-request.lifecycle";
        } else {
            throw new IllegalStateException("Unknown ticket type: " + ticketType);
        }

        ProcessInstance<?> instance = startProcess(processes.processById(processId));
        instance.start();

        log.info("Kogito process started processId={} instanceId={}", processId, instance.id());

        return instance.id();
    }

    private <T extends org.kie.kogito.Model> ProcessInstance<T> startProcess(org.kie.kogito.process.Process<T> process) {
        return process.createInstance(process.createModel());
    }
}
