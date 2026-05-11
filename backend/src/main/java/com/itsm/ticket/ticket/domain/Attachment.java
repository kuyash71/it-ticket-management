package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String mimeType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String storageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketEventVisibility visibility;

    @Column(nullable = false)
    private String uploadedBy;

    @Column(nullable = false)
    private Instant uploadedAt;

    protected Attachment() {}

    static Attachment of(Ticket ticket, String fileName, String mimeType, long sizeBytes,
                         String storageKey, TicketEventVisibility visibility, String uploadedBy) {
        Attachment a = new Attachment();
        a.id = UUID.randomUUID();
        a.ticket = ticket;
        a.fileName = fileName;
        a.mimeType = mimeType;
        a.sizeBytes = sizeBytes;
        a.storageKey = storageKey;
        a.visibility = visibility;
        a.uploadedBy = uploadedBy;
        a.uploadedAt = Instant.now();
        return a;
    }

    public UUID getId() { return id; }
    public String getFileName() { return fileName; }
    public String getMimeType() { return mimeType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getStorageKey() { return storageKey; }
    public TicketEventVisibility getVisibility() { return visibility; }
    public String getUploadedBy() { return uploadedBy; }
    public Instant getUploadedAt() { return uploadedAt; }
    public UUID getTicketId() { return ticket.getId(); }
}
