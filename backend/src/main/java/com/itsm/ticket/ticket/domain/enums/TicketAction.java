package com.itsm.ticket.ticket.domain.enums;

/**
 * Actions a role can perform on a ticket in a given state (Doc §11 "allowedActions").
 * The backend exposes these so the UI can hide unauthorized buttons (Doc §11 flowchart).
 */
public enum TicketAction {
    TAKE_OWNERSHIP,
    REQUEST_INFO,
    ADD_WORKLOG,
    ADD_COMMENT,
    ADD_ATTACHMENT,
    RESOLVE,
    CONFIRM_CLOSE,
    REOPEN_REQUEST,
    CHANGE_PRIORITY,
    OVERRIDE_STATUS,
    REASSIGN,
    FORCE_CLOSE,
    APPROVE_REQUEST,
    REJECT_REQUEST
}
