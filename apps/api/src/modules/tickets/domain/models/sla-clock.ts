import type { SlaClockState } from "@itsm/contracts";

/**
 * Snapshot type only.
 * Child entity behavior is intentionally encapsulated inside Ticket aggregate.
 */
export interface SlaClockSnapshot {
  state: SlaClockState;
  startedAt?: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
  elapsedSeconds: number;
}
