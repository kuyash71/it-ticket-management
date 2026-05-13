import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { IconAlertTriangle, IconLifeBuoy } from "./Icon";
export const Badge = ({ children, variant = "default", withDot = false, size = "md", className }) => {
    const classes = [
        "badge",
        variant !== "default" && `badge--${variant}`,
        withDot && "badge--dot",
        size === "sm" && "badge--sm",
        className
    ]
        .filter(Boolean)
        .join(" ");
    return _jsx("span", { className: classes, children: children });
};
const STATUS_VARIANT = {
    NEW: "status-new",
    IN_PROGRESS: "status-progress",
    WAITING_FOR_CUSTOMER: "status-waiting",
    RESOLVED: "status-resolved",
    CLOSED: "status-closed"
};
const STATUS_KEY = {
    NEW: "status.new",
    IN_PROGRESS: "status.in_progress",
    WAITING_FOR_CUSTOMER: "status.waiting",
    RESOLVED: "status.resolved",
    CLOSED: "status.closed"
};
export const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    return (_jsx(Badge, { variant: STATUS_VARIANT[status], withDot: true, children: t(STATUS_KEY[status]) }));
};
const PRIORITY_KEY = {
    LOW: "priority.low",
    MEDIUM: "priority.medium",
    HIGH: "priority.high",
    CRITICAL: "priority.critical"
};
export const PriorityBadge = ({ priority }) => {
    const { t } = useTranslation();
    const cls = priority.toLowerCase();
    return (_jsx("span", { className: `priority priority--${cls}`, children: t(PRIORITY_KEY[priority]) }));
};
const TYPE_KEY = {
    INCIDENT: "ticket.type.incident",
    SERVICE_REQUEST: "ticket.type.service_request"
};
export const TypeBadge = ({ type }) => {
    const { t } = useTranslation();
    const variant = type === "INCIDENT" ? "type-badge--incident" : "type-badge--service";
    return (_jsxs("span", { className: `type-badge ${variant}`, children: [type === "INCIDENT" ? _jsx(IconAlertTriangle, { size: 13, "aria-hidden": true }) : _jsx(IconLifeBuoy, { size: 13, "aria-hidden": true }), t(TYPE_KEY[type])] }));
};
