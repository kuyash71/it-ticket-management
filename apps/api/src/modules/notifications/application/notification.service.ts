import type { DomainEventName } from "@itsm/contracts";

export interface NotificationEnvelope {
  event: DomainEventName;
  ticketId: string;
  recipients: string[];
}

export class NotificationService {
  async publish(payload: NotificationEnvelope): Promise<void> {
    // Placeholder: channel strategy (email/in-app) should be implemented per environment.
    void payload;
  }
}
