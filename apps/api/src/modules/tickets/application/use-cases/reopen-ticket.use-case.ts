import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class ReopenTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(ticketId: string, actorRole: "CUSTOMER" | "AGENT" | "MANAGER"): Promise<Ticket> {
    const ticket = await this.repository.findById(ticketId);
    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (ticket.status !== "RESOLVED") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (actorRole === "CUSTOMER" || actorRole === "MANAGER") {
      const updated: Ticket = {
        ...ticket,
        status: "IN_PROGRESS",
        slaClockState: "RUNNING",
        updatedAt: new Date(),
        version: ticket.version + 1
      };

      await this.repository.save(updated);
      return updated;
    }

    throw new Error("UNAUTHORIZED_ACTION");
  }
}
