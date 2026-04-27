package com.itsm.ticket.workflow;

import com.itsm.ticket.ticket.domain.enums.TicketType;
import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class TicketWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(TicketWorkflowService.class);

    public long startTicketLifecycle(Map<String, Object> variables) {
        KieServices kieServices = KieServices.Factory.get();
        KieContainer kieContainer = kieServices.getKieClasspathContainer();
        KieSession kieSession = kieContainer.newKieSession("itsm-ticket-session");

        try {

            log.info("jBPM ticket lifecycle started with vars={}", variables);

            if(variables.get("ticketType").equals(TicketType.INCIDENT.name())) {
                return kieSession.startProcess("itsm.incident.lifecycle", variables).getId();

            }
            else if(variables.get("ticketType").equals( TicketType.SERVICE_REQUEST.name())) {
                return kieSession.startProcess("itsm.service-request.lifecycle", variables).getId();

            }
            else {
                throw new IllegalStateException("Unknown Ticket Type");
            }


        } finally {
            kieSession.dispose();
        }
    }
}
