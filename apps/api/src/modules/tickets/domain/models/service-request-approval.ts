import type { ApprovalState } from "@itsm/contracts";

/**
 * Snapshot type only.
 * Child entity behavior is intentionally encapsulated inside Ticket aggregate.
 */
export interface ServiceRequestApprovalSnapshot {
  state: ApprovalState;
  approverId?: string;
  reason?: string;
  updatedAt?: Date;
}
