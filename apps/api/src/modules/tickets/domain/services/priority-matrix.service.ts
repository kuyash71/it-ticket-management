import type { Impact, Priority, Urgency } from "@itsm/contracts";

const PRIORITY_MATRIX: Record<Impact, Record<Urgency, Priority>> = {
  LOW: {
    LOW: "LOW",
    MEDIUM: "LOW",
    HIGH: "MEDIUM"
  },
  MEDIUM: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH"
  },
  HIGH: {
    LOW: "MEDIUM",
    MEDIUM: "HIGH",
    HIGH: "CRITICAL"
  }
};

export const calculatePriority = (urgency: Urgency, impact: Impact): Priority => {
  return PRIORITY_MATRIX[impact][urgency];
};
