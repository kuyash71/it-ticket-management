package com.itsm.ticket.ticket.exception;

/** Wire-format error payload: machine-readable {@code error} code + human {@code message}. */
public record ErrorResponse(String error, String message) {
}
