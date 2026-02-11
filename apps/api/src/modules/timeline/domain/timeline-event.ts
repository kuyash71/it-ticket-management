import type { TimelineVisibility } from "@itsm/contracts";

export interface TimelineEvent {
  id: string;
  ticketId: string;
  type: string;
  visibility: TimelineVisibility;
  actorId?: string;
  content?: string;
  createdAt: string;
}
