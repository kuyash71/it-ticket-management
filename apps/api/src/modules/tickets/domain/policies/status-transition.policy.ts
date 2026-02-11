import type { Role, TicketStatus } from "@itsm/contracts";

const AGENT_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["IN_PROGRESS", "WAITING_FOR_CUSTOMER"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
};

export const canTransitionStatus = (
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  role: Role
): boolean => {
  if (role === "MANAGER") {
    return true;
  }

  if (role === "CUSTOMER") {
    return currentStatus === "RESOLVED" && nextStatus === "IN_PROGRESS";
  }

  return AGENT_TRANSITIONS[currentStatus].includes(nextStatus);
};

export const ensureValidTransition = (
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  role: Role
): void => {
  if (!canTransitionStatus(currentStatus, nextStatus, role)) {
    throw new Error(
      `INVALID_STATUS_TRANSITION: ${currentStatus} -> ${nextStatus} not allowed for role ${role}`
    );
  }
};
