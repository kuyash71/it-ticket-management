import type { TicketViewModel } from "../models/ticket-view-model";

interface TicketListProps {
  tickets: TicketViewModel[];
  selectedId: string;
  onSelect: (ticketId: string) => void;
}

export const TicketList = ({ tickets, selectedId, onSelect }: TicketListProps) => {
  return (
    <section className="panel">
      <h2>Tickets</h2>
      <ul className="ticket-list">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <button
              className={ticket.id === selectedId ? "ticket-button ticket-button--active" : "ticket-button"}
              onClick={() => onSelect(ticket.id)}
              type="button"
            >
              <strong>{ticket.id}</strong>
              <span>{ticket.title}</span>
              <small>
                {ticket.status} - {ticket.priority}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
