import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import type { TicketPriority, TicketStatus, TicketType } from "../../types/api";
import { IconAlertTriangle, IconLifeBuoy } from "./Icon";

type BadgeProps = PropsWithChildren<{
  variant?: "default" | "status-new" | "status-progress" | "status-waiting" | "status-resolved" | "status-closed";
  withDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}>;

export const Badge = ({ children, variant = "default", withDot = false, size = "md", className }: BadgeProps) => {
  const classes = [
    "badge",
    variant !== "default" && `badge--${variant}`,
    withDot && "badge--dot",
    size === "sm" && "badge--sm",
    className
  ]
    .filter(Boolean)
    .join(" ");
  return <span className={classes}>{children}</span>;
};

const STATUS_VARIANT: Record<TicketStatus, BadgeProps["variant"]> = {
  NEW: "status-new",
  IN_PROGRESS: "status-progress",
  WAITING_FOR_CUSTOMER: "status-waiting",
  RESOLVED: "status-resolved",
  CLOSED: "status-closed"
};

const STATUS_KEY: Record<TicketStatus, string> = {
  NEW: "status.new",
  IN_PROGRESS: "status.in_progress",
  WAITING_FOR_CUSTOMER: "status.waiting",
  RESOLVED: "status.resolved",
  CLOSED: "status.closed"
};

export const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const { t } = useTranslation();
  return (
    <Badge variant={STATUS_VARIANT[status]} withDot>
      {t(STATUS_KEY[status])}
    </Badge>
  );
};

const PRIORITY_KEY: Record<TicketPriority, string> = {
  LOW: "priority.low",
  MEDIUM: "priority.medium",
  HIGH: "priority.high",
  CRITICAL: "priority.critical"
};

export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
  const { t } = useTranslation();
  const cls = priority.toLowerCase();
  return (
    <span className={`priority priority--${cls}`}>
      {t(PRIORITY_KEY[priority])}
    </span>
  );
};

const TYPE_KEY: Record<TicketType, string> = {
  INCIDENT: "ticket.type.incident",
  SERVICE_REQUEST: "ticket.type.service_request"
};

export const TypeBadge = ({ type }: { type: TicketType }) => {
  const { t } = useTranslation();
  const variant = type === "INCIDENT" ? "type-badge--incident" : "type-badge--service";
  return (
    <span className={`type-badge ${variant}`}>
      {type === "INCIDENT" ? <IconAlertTriangle size={13} aria-hidden /> : <IconLifeBuoy size={13} aria-hidden />}
      {t(TYPE_KEY[type])}
    </span>
  );
};
