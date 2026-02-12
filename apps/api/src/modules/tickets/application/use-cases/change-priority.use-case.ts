import type { ChangePriorityCommand } from "../commands/change-priority.command";
import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ChangePriorityUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: ChangePriorityCommand): Promise<Ticket> {
    const ticket = await this.repository.findById(command.ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (command.actorRole === "CUSTOMER") {
      throw new Error("UNAUTHORIZED_ACTION");
    }

    ticket.changePriority(command.urgency, command.impact, new Date());

    await this.repository.save(ticket);
    return ticket;
  }
}
