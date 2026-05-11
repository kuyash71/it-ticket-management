package com.itsm.ticket.ticket.service;

import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.ticket.api.CreateTicketRequest;
import com.itsm.ticket.ticket.domain.*;
import com.itsm.ticket.ticket.domain.enums.TicketRole;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.domain.policy.TicketStatusTransition;
import com.itsm.ticket.ticket.exception.TicketNotFoundException;
import com.itsm.ticket.ticket.repository.TicketRepository;
import com.itsm.ticket.workflow.TicketWorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.List;
import java.util.Map;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketWorkflowService workflowService;
    private final KafkaLogProducer kafkaLogProducer;

    public TicketService(
            TicketRepository ticketRepository,
            TicketWorkflowService workflowService,
            KafkaLogProducer kafkaLogProducer
    ) {
        this.ticketRepository = ticketRepository;
        this.workflowService = workflowService;
        this.kafkaLogProducer = kafkaLogProducer;
    }

    @Transactional
    public Ticket create(CreateTicketRequest request) {
       Ticket created = switch (request.type()) {
           case INCIDENT -> ticketRepository.save(new IncidentTicket(request.title(), request.description()));
           case SERVICE_REQUEST -> ticketRepository.save(new ServiceRequestTicket(request.title(), request.description()));
  };
        String processInstanceId =
        workflowService.startTicketLifecycle(Map.of(
                "ticketId", created.getId().toString(),
                "ticketType", request.type().name(),
                "ticketStatus", created.getStatus().name()
        ));
        created.setProcessInstanceId(processInstanceId);
        ticketRepository.save(created);

        kafkaLogProducer.publish("TICKET_CREATED", Map.of(
                "ticketId", created.getId().toString(),
                "title", created.getTitle(),
                "type", request.type().name()
        ));

        return created;
    }

    @Transactional
    public Ticket changeStatus(UUID ticketId, TicketStatus target, TicketRole actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException(ticketId));
        ticket.transitionTo(target,actor,new TicketStatusTransition());
        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> list() {
        return ticketRepository.findAll();
    }
}
