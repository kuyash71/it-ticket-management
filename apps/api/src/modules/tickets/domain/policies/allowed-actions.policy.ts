import type { AllowedAction, Role, TicketStatus } from "@itsm/contracts";

const AGENT_BY_STATUS: Record<TicketStatus, AllowedAction[]> = {
  NEW: ["TAKE_OWNERSHIP", "REQUEST_INFO", "ADD_WORKLOG", "ADD_ATTACHMENT"],
  IN_PROGRESS: ["REQUEST_INFO", "RESOLVE", "ADD_WORKLOG", "ADD_ATTACHMENT"],
  WAITING_FOR_CUSTOMER: ["ADD_WORKLOG"],
  RESOLVED: ["ADD_WORKLOG"],
  CLOSED: []
};

const CUSTOMER_BY_STATUS: Record<TicketStatus, AllowedAction[]> = {
  NEW: ["ADD_COMMENT", "ADD_ATTACHMENT"],
  IN_PROGRESS: ["ADD_COMMENT", "ADD_ATTACHMENT"],
  WAITING_FOR_CUSTOMER: ["ADD_COMMENT", "ADD_ATTACHMENT"],
  RESOLVED: ["CONFIRM_CLOSE", "REOPEN_REQUEST"],
  CLOSED: []
};

const MANAGER_GLOBAL: AllowedAction[] = [
  "OVERRIDE_STATUS",
  "REASSIGN",
  "CHANGE_PRIORITY"
];

export const resolveAllowedActions = (
  status: TicketStatus,
  role: Role
): AllowedAction[] => {
  if (role === "MANAGER") {
    return MANAGER_GLOBAL;
  }

  if (role === "AGENT") {
    return AGENT_BY_STATUS[status];
  }

  return CUSTOMER_BY_STATUS[status];
};
