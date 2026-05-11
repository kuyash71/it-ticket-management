package com.itsm.ticket.ticket.api;

import com.itsm.ticket.ticket.domain.Attachment;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String fileName,
        String mimeType,
        long sizeBytes,
        String visibility,
        String uploadedBy,
        Instant uploadedAt
) {
    public static AttachmentResponse from(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getMimeType(),
                attachment.getSizeBytes(),
                attachment.getVisibility().name(),
                attachment.getUploadedBy(),
                attachment.getUploadedAt()
        );
    }
}
