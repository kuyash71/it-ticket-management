import type {
  ApprovalState,
  AllowedAction,
  Impact,
  Priority,
  Role,
  SlaRiskLevel,
  TicketStatus,
  TicketType,
  Urgency
} from "../enums";

export interface TicketSummaryDto {
  id: string;
  type: TicketType;
  title: string;
  status: TicketStatus;
  priority: Priority;
  urgency: Urgency;
  impact: Impact;
  assigneeId?: string;
  approvalState?: ApprovalState;
  slaRiskLevel: SlaRiskLevel;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailDto extends TicketSummaryDto {
  description: string;
  reporterId: string;
  allowedActions: AllowedAction[];
}

export interface AllowedActionsResponseDto {
  ticketId: string;
  role: Role;
  allowedActions: AllowedAction[];
}
