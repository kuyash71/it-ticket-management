import type { Ticket } from "../../domain/models/ticket";
import type { TicketRepository } from "./ticket.repository";

export class InMemoryTicketRepository implements TicketRepository {
  private readonly storage = new Map<string, Ticket>();

  async findById(ticketId: string): Promise<Ticket | null> {
    return this.storage.get(ticketId) ?? null;
  }

  async list(): Promise<Ticket[]> {
    return Array.from(this.storage.values());
  }

  async save(ticket: Ticket): Promise<void> {
    this.storage.set(ticket.id, ticket);
  }
}
