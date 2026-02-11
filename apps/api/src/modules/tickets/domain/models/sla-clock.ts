import type { SlaClockState } from "@itsm/contracts";

export interface SlaClock {
  state: SlaClockState;
  startedAt?: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
  elapsedSeconds: number;
}
