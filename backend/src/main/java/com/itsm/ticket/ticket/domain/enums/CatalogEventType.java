package com.itsm.ticket.ticket.domain.enums;

/** Canonical action codes written into {@link com.itsm.ticket.ticket.domain.AuditRecord}. */
public enum CatalogEventType {
    TICKET_CREATED,
    TICKET_UPDATED,
    STATUS_CHANGED,
    PRIORITY_CHANGED,
    SLA_PAUSED,
    SLA_RESUMED,
    SLA_BREACH_RISK,
    SLA_BREACHED,
    MANAGER_OVERRIDE,
    ATTACHMENT_ADDED,
    COMMENT_ADDED,
    WORKLOG_ADDED,
    ASSIGNMENT_CHANGED,
    APPROVAL_CHANGED,
    SERVICE_QUALITY_COMPLAINT,
    CUSTOMER_FEEDBACK,
    AUTO_REMINDER_SENT,
    AUTO_TIMEOUT_FLAGGED
}
