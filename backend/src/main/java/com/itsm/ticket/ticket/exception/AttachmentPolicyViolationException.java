package com.itsm.ticket.ticket.exception;

/** Thrown when an upload exceeds size, type or count policy. Maps to HTTP 400. */
public class AttachmentPolicyViolationException extends RuntimeException {
    public AttachmentPolicyViolationException(String message) {
        super(message);
    }
}
