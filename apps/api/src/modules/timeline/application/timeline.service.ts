import type { TimelineEvent } from "../domain/timeline-event";

export class TimelineService {
  async append(event: TimelineEvent): Promise<void> {
    // Placeholder: write to timeline event store.
    void event;
  }
}
