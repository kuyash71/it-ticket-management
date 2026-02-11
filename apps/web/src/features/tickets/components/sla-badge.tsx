import type { SlaRiskLevel } from "@itsm/contracts";

interface SlaBadgeProps {
  riskLevel: SlaRiskLevel;
}

export const SlaBadge = ({ riskLevel }: SlaBadgeProps) => {
  return <span className={`sla-badge sla-badge--${riskLevel.toLowerCase()}`}>{riskLevel}</span>;
};
