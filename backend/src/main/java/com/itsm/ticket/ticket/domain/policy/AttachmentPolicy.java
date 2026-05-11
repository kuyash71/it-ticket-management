package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.exception.AttachmentPolicyViolationException;

import java.util.Set;

public class AttachmentPolicy {

    public static final long MAX_SIZE_BYTES = 10L * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    public void validate(String mimeType, long sizeBytes) {
        if (sizeBytes > MAX_SIZE_BYTES) {
            throw new AttachmentPolicyViolationException(
                    "File size exceeds 10 MB limit: " + sizeBytes + " bytes");
        }
        if (!ALLOWED_TYPES.contains(mimeType)) {
            throw new AttachmentPolicyViolationException(
                    "File type not allowed: " + mimeType);
        }
    }
}
