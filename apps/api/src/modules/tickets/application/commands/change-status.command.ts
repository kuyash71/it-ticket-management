import type { Role, TicketStatus } from "@itsm/contracts";

export interface ChangeStatusCommand {
  ticketId: string;
  actorId: string;
  actorRole: Role;
  nextStatus: TicketStatus;
  reason?: string;
}
