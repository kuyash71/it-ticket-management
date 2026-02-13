package com.itsm.ticket.ticket.service;

import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.ticket.api.CreateTicketRequest;
import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.repository.TicketRepository;
import com.itsm.ticket.workflow.TicketWorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Ticket created = ticketRepository.save(new Ticket(request.type(), request.title(), request.description()));

        workflowService.startTicketLifecycle(Map.of(
                "ticketId", created.getId().toString(),
                "ticketType", created.getType().name(),
                "status", created.getStatus().name()
        ));

        kafkaLogProducer.publish("TICKET_CREATED", Map.of(
                "ticketId", created.getId().toString(),
                "title", created.getTitle(),
                "type", created.getType().name()
        ));

        return created;
    }

    @Transactional(readOnly = true)
    public List<Ticket> list() {
        return ticketRepository.findAll();
    }
}
