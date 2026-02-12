import { randomUUID } from "node:crypto";

import { Ticket } from "../../domain/models/ticket";
import type { CreateTicketCommand } from "../commands/create-ticket.command";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class CreateTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: CreateTicketCommand): Promise<Ticket> {
    const now = new Date();
    const ticket = Ticket.create({
      id: randomUUID(),
      type: command.type,
      title: command.title,
      description: command.description,
      reporterId: command.reporterId,
      urgency: command.urgency,
      impact: command.impact,
      requiresApproval: command.requiresApproval,
      createdAt: now
    });

    await this.repository.save(ticket);
    return ticket;
  }
}
