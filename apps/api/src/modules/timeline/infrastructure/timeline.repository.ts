import type { TimelineEvent } from "../domain/timeline-event";

export interface TimelineRepository {
  create(event: TimelineEvent): Promise<void>;
  listByTicket(ticketId: string): Promise<TimelineEvent[]>;
}
