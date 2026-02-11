import type { Role, TicketStatus } from "@itsm/contracts";

export interface ManagerOverrideCommand {
  ticketId: string;
  actorId: string;
  actorRole: Role;
  forcedStatus: TicketStatus;
  reason: string;
}
