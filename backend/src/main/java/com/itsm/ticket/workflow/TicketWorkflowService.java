package com.itsm.ticket.workflow;

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

    public void startTicketLifecycle(Map<String, Object> variables) {
        KieServices kieServices = KieServices.Factory.get();
        KieContainer kieContainer = kieServices.getKieClasspathContainer();
        KieSession kieSession = kieContainer.newKieSession("itsm-ticket-session");

        try {
            kieSession.startProcess("itsm.ticket.lifecycle", variables);
            log.info("jBPM ticket lifecycle started with vars={}", variables);
        } finally {
            kieSession.dispose();
        }
    }
}
