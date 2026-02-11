import type { TicketDetailDto } from "@itsm/contracts";

import { resolveAllowedActions } from "../../domain/policies/allowed-actions.policy";
import { resolveSlaRiskLevel } from "../../domain/services/sla-escalation.service";
import type { Ticket } from "../../domain/models/ticket";

const mapElapsedToProgress = (elapsedSeconds: number): number => {
  const mvpThreshold = 4 * 60 * 60;
  return (elapsedSeconds / mvpThreshold) * 100;
};

export const toTicketDetailDto = (
  ticket: Ticket,
  role: "CUSTOMER" | "AGENT" | "MANAGER"
): TicketDetailDto => {
  return {
    id: ticket.id,
    type: ticket.type,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    urgency: ticket.urgency,
    impact: ticket.impact,
    reporterId: ticket.reporterId,
    assigneeId: ticket.assigneeId,
    approvalState: ticket.approvalState,
    slaRiskLevel: resolveSlaRiskLevel(mapElapsedToProgress(ticket.slaElapsedSeconds)),
    allowedActions: resolveAllowedActions(ticket.status, role),
    version: ticket.version,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString()
  };
};
