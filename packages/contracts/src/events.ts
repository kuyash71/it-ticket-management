export const DOMAIN_EVENTS = [
  "TicketCreated",
  "TicketUpdated",
  "StatusChanged",
  "PriorityChanged",
  "SLAPaused",
  "SLAResumed",
  "SLABreachRisk",
  "SLABreached",
  "ManagerOverride",
  "AttachmentAdded"
] as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[number];
