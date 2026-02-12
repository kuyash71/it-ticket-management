import type { ReassignTicketCommand } from "../commands/reassign-ticket.command";
import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ReassignTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: ReassignTicketCommand): Promise<Ticket> {
    const ticket = await this.repository.findById(command.ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (command.actorRole === "CUSTOMER") {
      throw new Error("UNAUTHORIZED_ACTION");
    }

    ticket.reassign(command.assigneeId, new Date());

    await this.repository.save(ticket);
    return ticket;
  }
}
