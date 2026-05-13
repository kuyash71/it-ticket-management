import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { parseJwtPayload } from "../lib/jwt";
import { useRole } from "../auth/useRole";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { IconAlertTriangle, IconArrowRight, IconBarChart, IconCheckCircle, IconClock, IconInbox, IconPlus } from "../components/ui/Icon";
import { PriorityBadge, StatusBadge, TypeBadge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { formatRelative } from "../lib/format";
export const DashboardPage = ({ onOpenTicket, onNavigate, onCreateTicket }) => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { isCustomer } = useRole();
    const [tickets, setTickets] = useState(null);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const fetchAll = useCallback(async () => {
        setError(null);
        try {
            const [tx, sm] = await Promise.all([
                http.get("/api/tickets"),
                isCustomer() ? Promise.resolve(null) : http.get("/api/reports/summary").then((r) => r.data)
            ]);
            setTickets(tx.data);
            setSummary(sm);
        }
        catch {
            setError(t("error.fetch_failed"));
        }
    }, [t, isCustomer]);
    useEffect(() => {
        if (!token)
            return;
        void fetchAll();
    }, [token, fetchAll]);
    const recent = useMemo(() => {
        if (!tickets)
            return [];
        return [...tickets]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 6);
    }, [tickets]);
    const openCount = useMemo(() => {
        if (summary)
            return summary.openTickets;
        if (!tickets)
            return null;
        return tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED").length;
    }, [summary, tickets]);
    return (_jsxs("div", { className: "page-container", children: [_jsx(WelcomeBanner, { onCreate: onCreateTicket }), error && _jsx("div", { style: { marginBottom: "var(--space-4)" }, children: _jsx(ErrorBanner, { children: error }) }), _jsxs("div", { className: "stats-grid", children: [_jsx(StatCard, { label: t("dashboard.stat.open"), value: openCount, icon: _jsx(IconInbox, {}), loading: tickets === null }), !isCustomer() && (_jsxs(_Fragment, { children: [_jsx(StatCard, { label: t("dashboard.stat.resolved"), value: summary?.resolvedTotal, icon: _jsx(IconCheckCircle, {}), loading: summary === null }), _jsx(StatCard, { label: t("dashboard.stat.sla_breaches"), value: summary?.slaBreachCount, icon: _jsx(IconAlertTriangle, {}), tone: summary && summary.slaBreachCount > 0 ? "danger" : undefined, loading: summary === null }), _jsx(StatCard, { label: t("dashboard.stat.avg_resolution"), value: summary ? `${summary.avgResolutionHours.toFixed(1)}h` : null, icon: _jsx(IconClock, {}), loading: summary === null })] })), isCustomer() && tickets && (_jsx(StatCard, { label: t("dashboard.stat.total"), value: tickets.length, icon: _jsx(IconBarChart, {}) }))] }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("section", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("div", { className: "card-title", children: t("dashboard.recent.title") }), _jsx("div", { className: "card-subtitle", children: t("dashboard.recent.subtitle") })] }), _jsx(Button, { variant: "ghost", size: "sm", trailingIcon: _jsx(IconArrowRight, {}), onClick: () => onNavigate({ name: "tickets" }), children: t("dashboard.view_all") })] }), tickets === null ? (_jsxs("div", { style: { padding: "var(--space-4)" }, children: [_jsx(Skeleton, { variant: "title" }), _jsx("div", { style: { height: "var(--space-3)" } }), _jsx(Skeleton, {}), _jsx("div", { style: { height: "var(--space-2)" } }), _jsx(Skeleton, {})] })) : recent.length === 0 ? (_jsx(EmptyState, { icon: _jsx(IconInbox, { size: 20 }), title: t("ticket.empty"), description: t("ticket.empty.desc"), action: _jsx(Button, { variant: "primary", leadingIcon: _jsx(IconPlus, {}), onClick: onCreateTicket, children: t("ticket.create") }) })) : (_jsx("div", { className: "data-table-wrapper", style: { border: "none", borderRadius: 0 }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("ticket.col.title") }), _jsx("th", { children: t("ticket.col.status") }), !isCustomer() && _jsx("th", { children: t("ticket.col.priority") }), _jsx("th", { children: t("dashboard.updated") })] }) }), _jsx("tbody", { children: recent.map((tk) => (_jsxs("tr", { tabIndex: 0, onClick: () => onOpenTicket(tk.id), onKeyDown: (e) => { if (e.key === "Enter")
                                                    onOpenTicket(tk.id); }, children: [_jsx("td", { className: "col-title", children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)" }, children: [_jsx(TypeBadge, { type: tk.type }), _jsx("span", { children: tk.title })] }) }), _jsx("td", { children: _jsx(StatusBadge, { status: tk.status }) }), !isCustomer() && _jsx("td", { children: _jsx(PriorityBadge, { priority: tk.priority }) }), _jsx("td", { className: "text-muted text-xs", children: formatRelative(tk.updatedAt) })] }, tk.id))) })] }) }))] }), _jsxs("aside", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)" }, children: [_jsxs("div", { className: "card card--padded", children: [_jsx("div", { className: "section-header", style: { marginBottom: "var(--space-3)" }, children: _jsx("div", { className: "section-title", children: t("dashboard.quick.title") }) }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" }, children: [_jsx(Button, { variant: "default", block: true, leadingIcon: _jsx(IconPlus, {}), onClick: onCreateTicket, children: t("ticket.create") }), _jsx(Button, { variant: "ghost", block: true, leadingIcon: _jsx(IconInbox, {}), onClick: () => onNavigate({ name: "tickets" }), children: t("dashboard.quick.all_tickets") }), !isCustomer() && (_jsx(Button, { variant: "ghost", block: true, leadingIcon: _jsx(IconBarChart, {}), onClick: () => onNavigate({ name: "reports" }), children: t("dashboard.quick.reports") }))] })] }), summary && !isCustomer() && (_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("div", { className: "card-title", children: t("dashboard.status_breakdown") }) }), _jsx("div", { className: "card-body", children: _jsx("div", { className: "distribution", children: Object.entries(summary.byStatus).map(([status, count]) => {
                                                const total = summary.totalTickets || 1;
                                                const pct = (count / total) * 100;
                                                return (_jsxs("div", { className: "distribution-row", style: { gridTemplateColumns: "1fr 80px 30px" }, children: [_jsx("div", { className: "distribution-label", children: _jsx(StatusBadge, { status: status }) }), _jsx("div", { className: "distribution-track", children: _jsx("div", { className: "distribution-fill", style: { width: `${pct}%` } }) }), _jsx("div", { className: "distribution-value", children: count })] }, status));
                                            }) }) })] }))] })] })] }));
};
const WelcomeBanner = ({ onCreate }) => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const hour = new Date().getHours();
    const greetKey = hour < 6 ? "dashboard.greet.night" :
        hour < 12 ? "dashboard.greet.morning" :
            hour < 18 ? "dashboard.greet.afternoon" :
                "dashboard.greet.evening";
    const userName = (() => {
        if (!token)
            return "";
        try {
            const p = parseJwtPayload(token);
            return (p.given_name ?? p.name ?? p.preferred_username ?? "");
        }
        catch {
            return "";
        }
    })();
    return (_jsx("div", { className: "welcome-banner", children: _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsxs("h1", { className: "welcome-title", children: [t(greetKey), userName ? `, ${userName}` : ""] }), _jsx("p", { className: "welcome-subtitle", children: t("dashboard.welcome.subtitle") })] }), _jsx(Button, { variant: "primary", leadingIcon: _jsx(IconPlus, {}), onClick: onCreate, children: t("ticket.create") })] }) }));
};
const StatCard = ({ label, value, icon, tone, loading }) => (_jsxs("div", { className: "stat-card", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsx("div", { className: "stat-card-label", children: label }), _jsx("span", { style: { color: tone === "danger" ? "var(--color-danger)" : "var(--text-muted)" }, children: icon })] }), _jsx("div", { className: "stat-card-value", style: tone === "danger" ? { color: "var(--color-danger)" } : undefined, children: loading ? _jsx(Skeleton, { variant: "title", width: 60 }) : (value ?? 0) })] }));
