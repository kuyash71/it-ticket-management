package com.itsm.ticket.ticket.sla;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.logging.LogEvent;
import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.domain.policy.SLAEscalationService;
import com.itsm.ticket.ticket.notification.NotificationService;
import com.itsm.ticket.ticket.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Periodically checks every open ticket and emits SLABreachRisk / SLABreached events
 * the first time each threshold (Doc §6.7) is crossed.
 * Levels: NORMAL (<70%) → WARNING (≥70%) → RISK (≥85%) → BREACH (≥100%)
 */
@Component
public class SLAEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SLAEscalationScheduler.class);
    private static final SLAEscalationService POLICY = new SLAEscalationService();

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final KafkaLogProducer kafkaLogProducer;
    private final ObjectMapper objectMapper;

    public SLAEscalationScheduler(TicketRepository ticketRepository,
                                  NotificationService notificationService,
                                  KafkaLogProducer kafkaLogProducer,
                                  ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
        this.kafkaLogProducer = kafkaLogProducer;
        this.objectMapper = objectMapper;
    }

    /** Runs every minute (fixedDelay so it never overlaps itself). */
    @Scheduled(fixedDelayString = "${itsm.sla.check-interval-ms:60000}",
               initialDelayString = "${itsm.sla.initial-delay-ms:30000}")
    @Transactional
    public void evaluate() {
        List<Ticket> active = ticketRepository.findByStatusNotIn(
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED));
        for (Ticket ticket : active) {
            try {
                evaluateTicket(ticket);
            } catch (Exception e) {
                log.warn("SLA evaluation failed for ticket {}: {}", ticket.getId(), e.getMessage());
            }
        }
    }

    private void evaluateTicket(Ticket ticket) {
        if (ticket.getSlaClock() == null || ticket.getSlaClock().getDeadline() <= 0) return;

        long elapsed = ticket.currentElapsedSeconds();
        SLAEscalationLevel current = POLICY.evaluate(elapsed, ticket.getSlaClock().getDeadline());
        SLAEscalationLevel previous = ticket.getSlaLevel() != null ? ticket.getSlaLevel() : SLAEscalationLevel.NORMAL;

        if (current.ordinal() <= previous.ordinal()) return; // no upgrade — nothing to do

        ticket.setSlaLevel(current);

        CatalogEventType eventType = switch (current) {
            case WARNING, RISK -> CatalogEventType.SLA_BREACH_RISK;
            case BREACH -> CatalogEventType.SLA_BREACHED;
            default -> null;
        };
        if (eventType == null) return;

        String payload = toJson(Map.of(
                "event", eventType.name(),
                "level", current.name(),
                "elapsedSeconds", String.valueOf(elapsed),
                "deadlineSeconds", String.valueOf(ticket.getSlaClock().getDeadline())));

        ticket.recordSystemEvent("system", payload);
        ticket.audit("system", eventType, "SLA escalation auto-detected", payload);
        ticketRepository.save(ticket);

        kafkaLogProducer.publish(LogEvent.of(eventType.name(), ticket.getId().toString(), "system",
                Map.of("level", current.name(),
                        "elapsedSeconds", String.valueOf(elapsed),
                        "deadlineSeconds", String.valueOf(ticket.getSlaClock().getDeadline()))));

        notificationService.notify(ticket.getId(), eventType, Map.of("level", current.name()));

        log.info("SLA escalation ticketId={} level={} elapsed={}/{}s",
                ticket.getId(), current, elapsed, ticket.getSlaClock().getDeadline());
    }

    private String toJson(Map<String, String> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
