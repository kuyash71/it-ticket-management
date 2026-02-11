import type { AllowedAction, Role } from "@itsm/contracts";

const ROLE_ACTION_ALLOWLIST: Record<Role, Set<AllowedAction>> = {
  CUSTOMER: new Set(["ADD_COMMENT", "ADD_ATTACHMENT", "CONFIRM_CLOSE", "REOPEN_REQUEST"]),
  AGENT: new Set([
    "TAKE_OWNERSHIP",
    "REQUEST_INFO",
    "ADD_WORKLOG",
    "ADD_ATTACHMENT",
    "RESOLVE"
  ]),
  MANAGER: new Set(["OVERRIDE_STATUS", "REASSIGN", "CHANGE_PRIORITY"])
};

export const isActionAllowedByRole = (role: Role, action: AllowedAction): boolean => {
  return ROLE_ACTION_ALLOWLIST[role].has(action);
};
