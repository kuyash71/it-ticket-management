import type { Impact, TicketType, Urgency } from "@itsm/contracts";

export interface CreateTicketCommand {
  type: TicketType;
  title: string;
  description: string;
  reporterId: string;
  urgency: Urgency;
  impact: Impact;
  requiresApproval?: boolean;
}
