package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.exception.AttachmentPolicyViolationException;

import java.util.Set;

/** Size + MIME-type whitelist for uploads (Doc §7). 10 MB max. */
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

    /** @throws AttachmentPolicyViolationException if mime is rejected or size exceeds {@link #MAX_SIZE_BYTES} */
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
