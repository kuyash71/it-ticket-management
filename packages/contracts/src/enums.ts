export type Role = "CUSTOMER" | "AGENT" | "MANAGER";

export type TicketType = "INCIDENT" | "SERVICE_REQUEST";

export type TicketStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type Urgency = "LOW" | "MEDIUM" | "HIGH";

export type Impact = "LOW" | "MEDIUM" | "HIGH";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SlaClockState = "START" | "PAUSED" | "RUNNING" | "STOPPED";

export type SlaRiskLevel = "NORMAL" | "WARNING" | "RISK" | "BREACH";

export type TimelineVisibility = "INTERNAL" | "EXTERNAL";

export type AttachmentVisibility = "INTERNAL" | "EXTERNAL";

export type ApprovalState = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";

export type AllowedAction =
  | "TAKE_OWNERSHIP"
  | "REQUEST_INFO"
  | "ADD_COMMENT"
  | "ADD_WORKLOG"
  | "ADD_ATTACHMENT"
  | "RESOLVE"
  | "CONFIRM_CLOSE"
  | "REOPEN_REQUEST"
  | "OVERRIDE_STATUS"
  | "REASSIGN"
  | "CHANGE_PRIORITY";
