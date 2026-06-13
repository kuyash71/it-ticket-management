package com.itsm.ticket.ticket.domain.enums;

/** Category of an entry on the ticket timeline. */
public enum TicketEventType {
    COMMENT,
    WORKLOG,
    SYSTEM_EVENT,
    /** Doc §7.8 — Customer files a service-quality complaint against the agent/process. */
    SERVICE_QUALITY_COMPLAINT
}
