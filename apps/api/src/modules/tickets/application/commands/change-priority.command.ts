import type { Impact, Role, Urgency } from "@itsm/contracts";

export interface ChangePriorityCommand {
  ticketId: string;
  actorId: string;
  actorRole: Role;
  urgency: Urgency;
  impact: Impact;
  reason: string;
}
