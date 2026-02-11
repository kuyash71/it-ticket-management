import type {
  ApprovalState,
  Impact,
  Priority,
  SlaClockState,
  TicketStatus,
  TicketType,
  Urgency
} from "@itsm/contracts";

export interface Ticket {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  urgency: Urgency;
  impact: Impact;
  reporterId: string;
  assigneeId?: string;
  slaClockState: SlaClockState;
  slaElapsedSeconds: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  approvalState?: ApprovalState;
}
