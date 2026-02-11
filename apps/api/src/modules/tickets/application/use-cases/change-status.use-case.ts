import { ensureValidTransition } from "../../domain/policies/status-transition.policy";
import { nextSlaClockState } from "../../domain/services/sla-escalation.service";
import type { ChangeStatusCommand } from "../commands/change-status.command";
import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ChangeStatusUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: ChangeStatusCommand): Promise<Ticket> {
    const ticket = await this.repository.findById(command.ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    ensureValidTransition(ticket.status, command.nextStatus, command.actorRole);

    if (
      ticket.type === "SERVICE_REQUEST" &&
      command.nextStatus === "RESOLVED" &&
      ticket.approvalState === "PENDING"
    ) {
      throw new Error("APPROVAL_REQUIRED");
    }

    const now = new Date();
    const updated: Ticket = {
      ...ticket,
      status: command.nextStatus,
      slaClockState: nextSlaClockState(command.nextStatus, ticket.slaClockState),
      updatedAt: now,
      version: ticket.version + 1,
      resolvedAt: command.nextStatus === "RESOLVED" ? now : ticket.resolvedAt,
      closedAt: command.nextStatus === "CLOSED" ? now : ticket.closedAt
    };

    await this.repository.save(updated);
    return updated;
  }
}
