package com.itsm.ticket.ticket.domain.enums;

public enum TicketEventType {
    COMMENT,
    WORKLOG,
    SYSTEM_EVENT,
    /** Doc §7.8 — Customer files a service-quality complaint against the agent/process. */
    SERVICE_QUALITY_COMPLAINT
}
