import { randomUUID } from "node:crypto";

import { calculatePriority } from "../../domain/services/priority-matrix.service";
import type { Ticket } from "../../domain/models/ticket";
import type { CreateTicketCommand } from "../commands/create-ticket.command";
import type { TicketRepository } from "../../infrastructure/repositories/ticket.repository";

export class CreateTicketUseCase {
  constructor(private readonly repository: TicketRepository) {}

  async execute(command: CreateTicketCommand): Promise<Ticket> {
    const now = new Date();

    const ticket: Ticket = {
      id: randomUUID(),
      type: command.type,
      title: command.title,
      description: command.description,
      status: "NEW",
      priority: calculatePriority(command.urgency, command.impact),
      urgency: command.urgency,
      impact: command.impact,
      reporterId: command.reporterId,
      slaClockState: "START",
      slaElapsedSeconds: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
      approvalState:
        command.type === "SERVICE_REQUEST" && command.requiresApproval
          ? "PENDING"
          : "NOT_REQUIRED"
    };

    await this.repository.save(ticket);
    return ticket;
  }
}
