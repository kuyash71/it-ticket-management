import type { ApprovalState } from "@itsm/contracts";

export interface ServiceRequestApproval {
  state: ApprovalState;
  approverId?: string;
  reason?: string;
  updatedAt?: Date;
}
