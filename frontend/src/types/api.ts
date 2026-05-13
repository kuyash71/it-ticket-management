export type TicketStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketImpact = "LOW" | "MEDIUM" | "HIGH";

export type TicketUrgency = "LOW" | "MEDIUM" | "HIGH";

export type TicketType = "INCIDENT" | "SERVICE_REQUEST";

export type TimelineEventType = "COMMENT" | "WORKLOG" | "SYSTEM_EVENT";

export type Visibility = "INTERNAL" | "EXTERNAL";

export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED";

export type ResolutionCode =
  | "FIXED"
  | "WORKAROUND"
  | "USER_ERROR"
  | "CONFIGURATION_CHANGE"
  | "KNOWN_ERROR"
  | "NOT_REPRODUCIBLE"
  | "DUPLICATE"
  | "NO_ACTION_REQUIRED";

/**
 * Server-driven action catalog (Doc §11 "allowedActions").
 * The backend tells us which actions the current user can take,
 * so the UI hides buttons it shouldn't render.
 */
export type TicketAction =
  | "TAKE_OWNERSHIP"
  | "REQUEST_INFO"
  | "ADD_WORKLOG"
  | "ADD_COMMENT"
  | "ADD_ATTACHMENT"
  | "RESOLVE"
  | "CONFIRM_CLOSE"
  | "REOPEN_REQUEST"
  | "CHANGE_PRIORITY"
  | "OVERRIDE_STATUS"
  | "REASSIGN"
  | "FORCE_CLOSE"
  | "APPROVE_REQUEST"
  | "REJECT_REQUEST";

export type SLALevel = "NORMAL" | "WARNING" | "RISK" | "BREACH";
export type SLAClockState = "RUNNING" | "PAUSED" | "STOPPED";

export interface SlaInfo {
  elapsedSeconds: number;
  deadlineSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  level: SLALevel;
  clockState: SLAClockState;
}

export interface Ticket {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
  assigneeId: string | null;
  resolutionNote: string | null;
  resolutionCode: ResolutionCode | null;
  resolvedAt: string | null;
  closeReason: string | null;
  closedAt: string | null;
  approvalState: ApprovalState | null;
  allowedActions: TicketAction[];
  createdAt: string;
  updatedAt: string;
  sla: SlaInfo | null;
}

export interface AgentSummary {
  username: string;
  displayName: string;
  role: "AGENT" | "MANAGER";
}

export interface TimelineEvent {
  id: string;
  eventType: TimelineEventType;
  visibility: Visibility;
  actorId: string;
  body: string | null;
  payload: string | null;
  parentId: string | null;
  occurredAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  visibility: Visibility;
  uploadedBy: string;
  uploadedAt: string;
}

export interface SummaryReport {
  openTickets: number;
  totalTickets: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  resolvedTotal: number;
  slaBreachCount: number;
  slaBreachRatePercent: number;
  avgResolutionHours: number;
}

export interface AttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  visibility: Visibility;
}

export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  urgency?: TicketUrgency;
  attachments?: AttachmentInput[];
}

export interface OverrideStatusPayload {
  targetStatus: TicketStatus;
  reason: string;
}

export interface ReassignPayload {
  assignee: string;
  reason: string;
}

export interface AddCommentPayload {
  body: string;
  visibility: Visibility;
  parentId: string | null;
}

export interface AddWorklogPayload {
  body: string;
  visibility: Visibility;
}

export interface ResolveTicketPayload {
  resolutionNote: string;
  resolutionCode: ResolutionCode;
}

export interface ForceClosePayload {
  reason: string;
}

export interface ChangePriorityPayload {
  impact?: TicketImpact;
  urgency?: TicketUrgency;
  reason: string;
}

/**
 * Plain status-change transitions (no verification required):
 *   NEW → IN_PROGRESS / WAITING_FOR_CUSTOMER
 *   IN_PROGRESS → WAITING_FOR_CUSTOMER
 *   WAITING_FOR_CUSTOMER → IN_PROGRESS
 *
 * Verified transitions go through dedicated endpoints:
 *   IN_PROGRESS → RESOLVED   → POST /resolve  (body: resolutionNote)
 *   RESOLVED → CLOSED        → POST /confirm-close (CUSTOMER) or /force-close (MANAGER, body: reason)
 */
export const PLAIN_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["IN_PROGRESS", "WAITING_FOR_CUSTOMER"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS"],
  RESOLVED: [],
  CLOSED: [],
};
