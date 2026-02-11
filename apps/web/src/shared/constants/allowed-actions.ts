import type { AllowedAction } from "@itsm/contracts";

export const ACTION_LABELS: Record<AllowedAction, string> = {
  TAKE_OWNERSHIP: "Take ownership",
  REQUEST_INFO: "Request info",
  ADD_COMMENT: "Add comment",
  ADD_WORKLOG: "Add worklog",
  ADD_ATTACHMENT: "Add attachment",
  RESOLVE: "Resolve",
  CONFIRM_CLOSE: "Confirm close",
  REOPEN_REQUEST: "Request reopen",
  OVERRIDE_STATUS: "Override status",
  REASSIGN: "Reassign",
  CHANGE_PRIORITY: "Change priority"
};
