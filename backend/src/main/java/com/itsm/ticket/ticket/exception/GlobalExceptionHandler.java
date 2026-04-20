package com.itsm.ticket.ticket.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

      @ExceptionHandler(IllegalStatusTransitionException.class)
      @ResponseStatus(HttpStatus.CONFLICT)
      public ErrorResponse handleIllegalTransition(IllegalStatusTransitionException ex) {
          return new ErrorResponse("CONFLICT", ex.getMessage());
      }

      @ExceptionHandler(TicketNotFoundException.class)
      @ResponseStatus(HttpStatus.NOT_FOUND)
      public ErrorResponse handleTicketNotFound(TicketNotFoundException ex) {
          return new ErrorResponse("NOT FOUND", ex.getMessage());
      }

      @ExceptionHandler(UnauthorizedOperationException.class)
      @ResponseStatus(HttpStatus.FORBIDDEN)
      public ErrorResponse handleUnauthorizedAction(UnauthorizedOperationException ex) {
          return new ErrorResponse("UNAUTHORIZED ACTION", ex.getMessage());
      }

      @ExceptionHandler(MethodArgumentNotValidException.class)
      @ResponseStatus(HttpStatus.BAD_REQUEST)
      public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
      String message = ex.getBindingResult().getFieldErrors().stream()
          .map(e -> e.getField() + ": " + e.getDefaultMessage())
          .collect(Collectors.joining(", "));
      return new ErrorResponse("VALIDATION_ERROR", message);
  }
  }


