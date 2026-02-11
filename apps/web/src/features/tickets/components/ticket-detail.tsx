import type { TicketViewModel } from "../models/ticket-view-model";
import { SlaBadge } from "./sla-badge";
import { StatusActionBar } from "./status-action-bar";

interface TicketDetailProps {
  ticket: TicketViewModel;
}

export const TicketDetail = ({ ticket }: TicketDetailProps) => {
  return (
    <section className="panel">
      <h2>{ticket.title}</h2>
      <p>{ticket.description}</p>
      <div className="ticket-meta">
        <span>{ticket.type}</span>
        <span>{ticket.status}</span>
        <span>{ticket.priority}</span>
        <SlaBadge riskLevel={ticket.slaRiskLevel} />
      </div>
      <StatusActionBar actions={ticket.allowedActions} />
    </section>
  );
};
