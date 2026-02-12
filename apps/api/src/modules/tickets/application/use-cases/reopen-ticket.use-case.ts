import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ReopenTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(ticketId: string, actorRole: "CUSTOMER" | "AGENT" | "MANAGER"): Promise<Ticket> {
    const ticket = await this.repository.findById(ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (ticket.getStatus() !== "RESOLVED") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (actorRole === "CUSTOMER" || actorRole === "MANAGER") {
      ticket.changeStatus("IN_PROGRESS", actorRole, new Date());
      await this.repository.save(ticket);
      return ticket;
    }

    throw new Error("UNAUTHORIZED_ACTION");
  }
}
