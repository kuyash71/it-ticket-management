package com.itsm.ticket.ticket.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Translates domain and security exceptions into {@link ErrorResponse} payloads with the
 * appropriate HTTP status. Error messages are i18n'd via {@link MessageSource}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(IllegalStatusTransitionException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleIllegalTransition(IllegalStatusTransitionException ex) {
        return new ErrorResponse("CONFLICT", msg("error.illegal_status_transition", ex.getMessage()));
    }

    @ExceptionHandler(TicketNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTicketNotFound(TicketNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", msg("ticket.not_found", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedOperationException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleUnauthorizedAction(UnauthorizedOperationException ex) {
        return new ErrorResponse("UNAUTHORIZED_ACTION", msg("auth.unauthorized", ex.getMessage()));
    }

    @ExceptionHandler(AttachmentPolicyViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleAttachmentPolicy(AttachmentPolicyViolationException ex) {
        return new ErrorResponse("ATTACHMENT_POLICY_VIOLATION", msg("error.attachment.policy_violation", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgument(IllegalArgumentException ex) {
        log.debug("Bad request: {}", ex.getMessage());
        String msg = ex.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = msg("error.bad_request", "Invalid request");
        }
        return new ErrorResponse("BAD_REQUEST", msg);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return new ErrorResponse("VALIDATION_ERROR", msg("error.validation", "Validation failed") + " (" + detail + ")");
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleAccessDenied(AccessDeniedException ex) {
        return new ErrorResponse("FORBIDDEN", msg("auth.forbidden", "Access denied"));
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleAuthentication(AuthenticationException ex) {
        return new ErrorResponse("UNAUTHENTICATED", msg("auth.unauthenticated", "Authentication required"));
    }

    /** Doc §11 — @Version mismatch → 409. */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleOptimisticLock(org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
        log.warn("Concurrency conflict: {}", ex.getMessage());
        return new ErrorResponse("VERSION_CONFLICT",
                msg("error.version_conflict",
                        "Ticket was modified concurrently — please reload and retry"));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneral(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }

    private String msg(String code, String fallback) {
        return messageSource.getMessage(code, null, fallback, LocaleContextHolder.getLocale());
    }
}
