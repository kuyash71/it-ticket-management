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
    id: ticket.getId(),
    type: ticket.getType(),
    title: ticket.getTitle(),
    description: ticket.getDescription(),
    status: ticket.getStatus(),
    priority: ticket.getPriority(),
    urgency: ticket.getUrgency(),
    impact: ticket.getImpact(),
    reporterId: ticket.getReporterId(),
    assigneeId: ticket.getAssigneeId(),
    approvalState: ticket.getApprovalState(),
    slaRiskLevel: resolveSlaRiskLevel(mapElapsedToProgress(ticket.getSlaElapsedSeconds())),
    allowedActions: resolveAllowedActions(ticket.getStatus(), role),
    version: ticket.getVersion(),
    createdAt: ticket.getCreatedAt().toISOString(),
    updatedAt: ticket.getUpdatedAt().toISOString()
  };
};
