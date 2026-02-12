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

    ticket.changeStatus(command.nextStatus, command.actorRole, new Date());

    await this.repository.save(ticket);
    return ticket;
  }
}
