package com.itsm.ticket.ticket.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itsm.ticket.logging.KafkaLogProducer;
import com.itsm.ticket.logging.LogEvent;
import com.itsm.ticket.notification.MailService;
import com.itsm.ticket.ticket.domain.SLAClock;
import com.itsm.ticket.ticket.domain.Ticket;
import com.itsm.ticket.ticket.domain.enums.CatalogEventType;
import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import com.itsm.ticket.ticket.domain.enums.TicketStatus;
import com.itsm.ticket.ticket.notification.NotificationService;
import com.itsm.ticket.ticket.repository.TicketRepository;
import com.itsm.ticket.users.KnownAgentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Doc §4.2 — Yanıtsız Müşteri / Abandoned-Case akışı.
 *
 * <p>Saatlik tarama: WAITING_FOR_CUSTOMER state'indeki ticket'ların SLAClock.pausedAt'ı
 * referans alınır. {@code reminderHours} threshold'unu geçmiş ve daha önce reminder
 * gönderilmemiş ticket'lara mail + audit + system event üretilir. {@code timeoutHours}
 * geçmiş ve henüz flag'lenmemiş ticket'lar manager'a notification ile bildirilir.
 *
 * <p>Idempotency, Ticket üzerindeki {@code reminderSentAt} ve {@code abandonedFlaggedAt}
 * alanlarıyla sağlanır.
 *
 * <p>Tasarım: ticket başına ayrı kısa transaction kullanılır. SMTP çağrısı tx <i>dışında</i>
 * (commit sonrası) yapılır — mail server timeout'u DB tx'ini stretch'lemez ve rollback durumunda
 * duplicate mail önlenir.
 */
@Component
public class AbandonedTicketScheduler {

    private static final Logger log = LoggerFactory.getLogger(AbandonedTicketScheduler.class);
    private static final int BATCH = 200;

    private final TicketRepository ticketRepository;
    private final KnownAgentRepository knownAgentRepository;
    private final MailService mailService;
    private final NotificationService notificationService;
    private final KafkaLogProducer kafkaLogProducer;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate txTemplate;
    private final long reminderHours;
    private final long timeoutHours;

    public AbandonedTicketScheduler(TicketRepository ticketRepository,
                                    KnownAgentRepository knownAgentRepository,
                                    MailService mailService,
                                    NotificationService notificationService,
                                    KafkaLogProducer kafkaLogProducer,
                                    ObjectMapper objectMapper,
                                    PlatformTransactionManager txManager,
                                    @Value("${itsm.abandoned.reminder-hours:24}") long reminderHours,
                                    @Value("${itsm.abandoned.timeout-hours:168}") long timeoutHours) {
        this.ticketRepository = ticketRepository;
        this.knownAgentRepository = knownAgentRepository;
        this.mailService = mailService;
        this.notificationService = notificationService;
        this.kafkaLogProducer = kafkaLogProducer;
        this.objectMapper = objectMapper;
        this.txTemplate = new TransactionTemplate(txManager);
        this.reminderHours = reminderHours;
        this.timeoutHours = timeoutHours;
    }

    /** Default: her saat başı (top of hour). */
    @Scheduled(cron = "${itsm.abandoned.scan-cron:0 0 * * * *}")
    public void scan() {
        Instant now = Instant.now();
        Instant reminderCutoff = now.minus(Duration.ofHours(reminderHours));
        Instant timeoutCutoff = now.minus(Duration.ofHours(timeoutHours));

        int reminded = 0, flagged = 0, total = 0;
        int page = 0;
        while (true) {
            Page<Ticket> chunk = ticketRepository.findByStatusNotIn(
                    List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.NEW, TicketStatus.IN_PROGRESS),
                    PageRequest.of(page, BATCH));
            if (chunk.isEmpty()) break;
            total += chunk.getNumberOfElements();
            List<UUID> ids = chunk.getContent().stream().map(Ticket::getId).toList();
            for (UUID id : ids) {
                try {
                    int[] counters = txTemplate.execute(status -> processOne(id, reminderCutoff, timeoutCutoff));
                    if (counters != null) {
                        reminded += counters[0];
                        flagged += counters[1];
                    }
                } catch (Exception e) {
                    log.warn("Abandoned scan failed for ticket {}: {}", id, e.getMessage());
                }
            }
            if (!chunk.hasNext()) break;
            page++;
        }
        if (reminded + flagged > 0) {
            log.info("Abandoned scan: reminded={} flagged={} total candidates={}",
                    reminded, flagged, total);
        }
    }

    /**
     * Tek bir ticket için işlem — kısa, kendi transaction'ında çalışır.
     * SMTP / Kafka / Notification afterCommit hookları ile commit sonrasına alınır.
     * Returns [reminded, flagged] sayaçları.
     */
    private int[] processOne(UUID ticketId, Instant reminderCutoff, Instant timeoutCutoff) {
        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) return new int[]{0, 0};
        if (ticket.getStatus() != TicketStatus.WAITING_FOR_CUSTOMER) return new int[]{0, 0};

        SLAClock clock = ticket.getSlaClock();
        if (clock == null || clock.getState() != SLAClockState.PAUSED || clock.getPausedAt() == null) {
            return new int[]{0, 0};
        }
        Instant pausedAt = clock.getPausedAt();

        int reminded = 0, flagged = 0;
        List<Runnable> afterCommitActions = new ArrayList<>();

        if (ticket.getReminderSentAt() == null && pausedAt.isBefore(reminderCutoff)) {
            String email = knownAgentRepository.findEmailByUsername(ticket.getReporterId()).orElse(null);
            ticket.markReminderSent();
            ticket.recordSystemEvent("system", toJson(Map.of(
                    "event", "AUTO_REMINDER_SENT",
                    "ticketId", ticket.getId().toString(),
                    "recipient", email != null ? email : "")));
            ticket.audit("system", CatalogEventType.AUTO_REMINDER_SENT, null,
                    toJson(Map.of("hours", String.valueOf(reminderHours))));
            // Mail send — commit sonrasında. SMTP timeout'u tx'i stretch'lemez,
            // rollback durumunda duplicate mail gitmez.
            final String to = email;
            final UUID tid = ticket.getId();
            final String title = ticket.getTitle();
            afterCommitActions.add(() -> mailService.sendReminder(to, tid, title));
            reminded = 1;
        }

        if (ticket.getAbandonedFlaggedAt() == null && pausedAt.isBefore(timeoutCutoff)) {
            ticket.markAbandonedFlagged();
            ticket.recordSystemEvent("system", toJson(Map.of(
                    "event", "AUTO_TIMEOUT_FLAGGED",
                    "ticketId", ticket.getId().toString(),
                    "hours", String.valueOf(timeoutHours))));
            ticket.audit("system", CatalogEventType.AUTO_TIMEOUT_FLAGGED, null,
                    toJson(Map.of("hours", String.valueOf(timeoutHours))));
            flagged = 1;
        }

        ticketRepository.save(ticket);

        // Kafka publish + notification — producer içinde afterCommit'e zaten kayıt yapar.
        if (reminded == 1) {
            kafkaLogProducer.publish(LogEvent.of("AUTO_REMINDER_SENT", ticket.getId().toString(),
                    "system", Map.of("reporter", ticket.getReporterId() != null ? ticket.getReporterId() : "")));
        }
        if (flagged == 1) {
            notificationService.notify(ticket.getId(), CatalogEventType.AUTO_TIMEOUT_FLAGGED,
                    Map.of("hours", String.valueOf(timeoutHours)));
            kafkaLogProducer.publish(LogEvent.of("AUTO_TIMEOUT_FLAGGED", ticket.getId().toString(),
                    "system", Map.of("hours", String.valueOf(timeoutHours))));
        }

        // Mail send'i tx commit'ten sonra çalıştır.
        if (!afterCommitActions.isEmpty()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            for (Runnable r : afterCommitActions) {
                                try { r.run(); } catch (Exception e) {
                                    log.warn("afterCommit action failed: {}", e.getMessage());
                                }
                            }
                        }
                    });
        }
        return new int[]{reminded, flagged};
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
