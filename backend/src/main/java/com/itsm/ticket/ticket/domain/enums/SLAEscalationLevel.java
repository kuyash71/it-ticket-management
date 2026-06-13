package com.itsm.ticket.ticket.domain.enums;

/** Escalation tier driven by the SLA elapsed/deadline ratio. */
public enum SLAEscalationLevel {
    NORMAL,
    WARNING,
    RISK,
    BREACH
}
