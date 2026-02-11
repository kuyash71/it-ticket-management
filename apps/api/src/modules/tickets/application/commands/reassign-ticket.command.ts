import type { Role } from "@itsm/contracts";

export interface ReassignTicketCommand {
  ticketId: string;
  actorId: string;
  actorRole: Role;
  assigneeId: string;
  reason: string;
}
