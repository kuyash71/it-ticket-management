import type { TicketViewModel } from "../models/ticket-view-model";

interface TimelinePanelProps {
  ticket: TicketViewModel;
}

export const TimelinePanel = ({ ticket }: TimelinePanelProps) => {
  return (
    <section className="panel">
      <h3>Timeline</h3>
      <ul className="timeline-list">
        {ticket.timeline.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.type}</strong>
            <p>{entry.content}</p>
            <small>
              {entry.visibility} - {new Date(entry.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
};
