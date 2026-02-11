import type { DomainEventName } from "@itsm/contracts";

export interface NotificationRule {
  event: DomainEventName;
  strategy: "ALWAYS" | "CONDITIONAL";
  audience: "CUSTOMER" | "AGENT" | "MANAGER" | "MULTI";
}

export const MVP_NOTIFICATION_RULES: NotificationRule[] = [
  { event: "SLABreachRisk", strategy: "ALWAYS", audience: "MANAGER" },
  { event: "SLABreached", strategy: "ALWAYS", audience: "MANAGER" },
  { event: "StatusChanged", strategy: "CONDITIONAL", audience: "MULTI" },
  { event: "TicketCreated", strategy: "CONDITIONAL", audience: "AGENT" },
  { event: "AttachmentAdded", strategy: "CONDITIONAL", audience: "MULTI" }
];
