import type { ManagerOverrideCommand } from "../commands/manager-override.command";
import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ManagerOverrideUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: ManagerOverrideCommand): Promise<Ticket> {
    const ticket = await this.repository.findById(command.ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (command.actorRole !== "MANAGER") {
      throw new Error("UNAUTHORIZED_ACTION");
    }

    ticket.managerOverride(command.forcedStatus, new Date());

    await this.repository.save(ticket);
    return ticket;
  }
}
