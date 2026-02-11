import { randomUUID } from "node:crypto";

export interface CreateComplaintCommand {
  ticketId: string;
  reporterId: string;
  description: string;
}

export interface ComplaintRecord {
  id: string;
  ticketId: string;
  reporterId: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "CLOSED";
  createdAt: string;
}

export class CreateComplaintUseCase {
  async execute(command: CreateComplaintCommand): Promise<ComplaintRecord> {
    return {
      id: randomUUID(),
      ticketId: command.ticketId,
      reporterId: command.reporterId,
      description: command.description,
      status: "OPEN",
      createdAt: new Date().toISOString()
    };
  }
}
