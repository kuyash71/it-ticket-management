package com.itsm.ticket.ticket.domain.enums;

/** Classification of how a ticket was resolved (Doc §4.1). */
public enum ResolutionCode {
    FIXED,
    WORKAROUND,
    USER_ERROR,
    CONFIGURATION_CHANGE,
    KNOWN_ERROR,
    NOT_REPRODUCIBLE,
    DUPLICATE,
    NO_ACTION_REQUIRED
}
