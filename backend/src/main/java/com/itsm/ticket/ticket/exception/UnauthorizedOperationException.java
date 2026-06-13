package com.itsm.ticket.ticket.exception;

/** Thrown when the caller lacks the role/ownership required for an operation. Maps to HTTP 403. */
public class UnauthorizedOperationException extends RuntimeException {
    public UnauthorizedOperationException(String message) {
        super(message);
    }
}
