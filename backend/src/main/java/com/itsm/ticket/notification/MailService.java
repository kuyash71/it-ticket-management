package com.itsm.ticket.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Doc §4.2 — Sends abandoned-case reminder mails. Runs in log-only mode when
 * {@code spring.mail.host} is unset so the rest of the app still works without SMTP.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final String fromAddress;
    private final boolean enabled;

    public MailService(JavaMailSender sender,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${itsm.abandoned.from-address:noreply@itsm.local}") String fromAddress) {
        this.sender = sender;
        this.fromAddress = fromAddress;
        this.enabled = host != null && !host.isBlank();
        if (!enabled) {
            log.info("SMTP host not configured — MailService running in log-only mode");
        }
    }

    /**
     * Sends a reminder mail. Returns {@code true} on send, {@code false} when skipped
     * (no email / log-only mode) or when SMTP transport fails. Never throws — callers rely
     * on {@code Ticket.reminderSentAt} for idempotency.
     */
    public boolean sendReminder(String toEmail, UUID ticketId, String ticketTitle) {
        if (toEmail == null || toEmail.isBlank()) {
            log.info("Reminder skipped: no email on file ticketId={}", ticketId);
            return false;
        }
        if (!enabled) {
            log.info("Reminder skipped (log-only mode) to={} ticketId={} title={}",
                    toEmail, ticketId, ticketTitle);
            return false;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(toEmail);
            msg.setSubject("ITSM Ticket Reminder: " + ticketId);
            msg.setText(
                    "Merhaba,\n\n" +
                    "Sizden bilgi beklediğimiz bir destek talebi var:\n" +
                    "Talep No: " + ticketId + "\n" +
                    "Başlık: " + ticketTitle + "\n\n" +
                    "Yanıtınızı bekliyoruz. Talep belirli süre içinde güncellenmezse otomatik olarak " +
                    "kapatılma kuyruğuna alınacaktır.\n\n" +
                    "ITSM Ekibi");
            sender.send(msg);
            log.info("Reminder mail sent to={} ticketId={}", toEmail, ticketId);
            return true;
        } catch (MailException ex) {
            log.warn("Reminder mail failed to={} ticketId={}: {}", toEmail, ticketId, ex.getMessage());
            return false;
        }
    }
}
