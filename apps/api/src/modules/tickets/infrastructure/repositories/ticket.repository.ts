import type { Ticket } from "../../domain/models/ticket";

export interface TicketRepository {
  findById(ticketId: string): Promise<Ticket | null>;
  list(): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<void>;
}
