import type { SlaRiskLevel, TicketStatus } from "@itsm/contracts";

export const resolveSlaRiskLevel = (progressPercent: number): SlaRiskLevel => {
  if (progressPercent >= 100) {
    return "BREACH";
  }

  if (progressPercent >= 85) {
    return "RISK";
  }

  if (progressPercent >= 70) {
    return "WARNING";
  }

  return "NORMAL";
};

export const nextSlaClockState = (
  nextStatus: TicketStatus,
  currentState: "START" | "PAUSED" | "RUNNING" | "STOPPED"
): "START" | "PAUSED" | "RUNNING" | "STOPPED" => {
  if (nextStatus === "WAITING_FOR_CUSTOMER") {
    return "PAUSED";
  }

  if (nextStatus === "IN_PROGRESS") {
    if (currentState === "STOPPED") {
      return "RUNNING";
    }

    return currentState === "START" ? "START" : "RUNNING";
  }

  if (nextStatus === "RESOLVED") {
    return "STOPPED";
  }

  return currentState;
};
