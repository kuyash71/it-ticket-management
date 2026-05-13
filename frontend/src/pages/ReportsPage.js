import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { http } from "../api/http";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { IconAlertTriangle, IconBarChart, IconCheckCircle, IconClock, IconInbox, IconRefresh, IconTrend } from "../components/ui/Icon";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge, TypeBadge } from "../components/ui/Badge";
export const ReportsPage = () => {
    const { t } = useTranslation();
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const fetchReport = useCallback(async () => {
        setError(null);
        try {
            const res = await http.get("/api/reports/summary");
            setReport(res.data);
        }
        catch {
            setError(t("error.fetch_failed"));
        }
    }, [t]);
    useEffect(() => {
        void fetchReport();
    }, [fetchReport]);
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: t("report.title") }), _jsx("p", { className: "page-subtitle", children: t("report.subtitle") })] }), _jsx("div", { className: "page-actions", children: _jsx(Button, { variant: "ghost", size: "sm", leadingIcon: _jsx(IconRefresh, {}), onClick: () => void fetchReport(), children: t("action.refresh") }) })] }), error && (_jsx("div", { style: { marginBottom: "var(--space-4)" }, children: _jsx(ErrorBanner, { children: error }) })), _jsxs("div", { className: "stats-grid", children: [_jsx(ReportStat, { label: t("report.open_tickets"), value: report?.openTickets, icon: _jsx(IconInbox, {}), loading: report === null }), _jsx(ReportStat, { label: t("report.total_tickets"), value: report?.totalTickets, icon: _jsx(IconBarChart, {}), loading: report === null }), _jsx(ReportStat, { label: t("report.resolved_total"), value: report?.resolvedTotal, icon: _jsx(IconCheckCircle, {}), loading: report === null }), _jsx(ReportStat, { label: t("report.sla_breach_count"), value: report?.slaBreachCount, icon: _jsx(IconAlertTriangle, {}), tone: report && report.slaBreachCount > 0 ? "danger" : undefined, loading: report === null }), _jsx(ReportStat, { label: t("report.sla_breach_rate"), value: report ? `${report.slaBreachRatePercent.toFixed(1)}%` : null, icon: _jsx(IconTrend, {}), tone: report && report.slaBreachRatePercent > 20 ? "danger" : undefined, loading: report === null }), _jsx(ReportStat, { label: t("report.avg_resolution_hours"), value: report ? `${report.avgResolutionHours.toFixed(1)}h` : null, icon: _jsx(IconClock, {}), loading: report === null })] }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("section", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: t("report.by_status") }), _jsx("div", { className: "card-subtitle", children: t("report.by_status.subtitle") })] }) }), _jsx("div", { className: "card-body", children: report === null ? (_jsx(DistributionSkeleton, {})) : (_jsx(StatusDistribution, { data: report.byStatus, total: report.totalTickets })) })] }), _jsxs("aside", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)" }, children: [_jsxs("section", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("div", { className: "card-title", children: t("report.by_type") }) }), _jsx("div", { className: "card-body", children: report === null ? (_jsx(DistributionSkeleton, { rows: 2 })) : (_jsx(TypeDistribution, { data: report.byType, total: report.totalTickets })) })] }), report && (_jsxs("section", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("div", { className: "card-title", children: t("report.sla_overview") }) }), _jsx("div", { className: "card-body", children: _jsx(SLAOverview, { report: report }) })] }))] })] })] }));
};
const ReportStat = ({ label, value, icon, tone, loading }) => (_jsxs("div", { className: "stat-card", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsx("div", { className: "stat-card-label", children: label }), _jsx("span", { style: { color: tone === "danger" ? "var(--color-danger)" : "var(--text-muted)" }, children: icon })] }), _jsx("div", { className: "stat-card-value", style: tone === "danger" ? { color: "var(--color-danger)" } : undefined, children: loading ? _jsx(Skeleton, { variant: "title", width: 60 }) : (value ?? 0) })] }));
const StatusDistribution = ({ data, total }) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const safeTotal = total || 1;
    return (_jsx("div", { className: "distribution", children: entries.map(([status, count]) => {
            const pct = (count / safeTotal) * 100;
            return (_jsxs("div", { className: "distribution-row", children: [_jsx("div", { className: "distribution-label", children: _jsx(StatusBadge, { status: status }) }), _jsx("div", { className: "distribution-track", children: _jsx("div", { className: "distribution-fill", style: { width: `${pct}%` } }) }), _jsx("div", { className: "distribution-value", children: count })] }, status));
        }) }));
};
const TypeDistribution = ({ data, total }) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const safeTotal = total || 1;
    return (_jsx("div", { className: "distribution", children: entries.map(([type, count]) => {
            const pct = (count / safeTotal) * 100;
            return (_jsxs("div", { className: "distribution-row", children: [_jsx("div", { className: "distribution-label", children: _jsx(TypeBadge, { type: type }) }), _jsx("div", { className: "distribution-track", children: _jsx("div", { className: "distribution-fill", style: { width: `${pct}%` } }) }), _jsx("div", { className: "distribution-value", children: count })] }, type));
        }) }));
};
const SLAOverview = ({ report }) => {
    const { t } = useTranslation();
    const total = report.totalTickets || 1;
    const breachPct = report.slaBreachRatePercent;
    const resolvedPct = (report.resolvedTotal / total) * 100;
    const breachClass = breachPct >= 50 ? "distribution-fill--danger" :
        breachPct >= 20 ? "distribution-fill--warning" :
            "distribution-fill--success";
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)" }, children: [_jsx(SLABar, { label: t("report.sla_breach_rate"), valueLabel: `${breachPct.toFixed(1)}%`, pct: Math.min(breachPct, 100), fillClass: breachClass, caption: t("report.sla_breach_caption", { count: report.slaBreachCount, total }) }), _jsx(SLABar, { label: t("report.resolution_rate"), valueLabel: `${resolvedPct.toFixed(0)}%`, pct: resolvedPct, fillClass: "distribution-fill--success", caption: t("report.resolved_caption", { count: report.resolvedTotal, total }) })] }));
};
const SLABar = ({ label, valueLabel, pct, fillClass, caption }) => (_jsxs("div", { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }, children: [_jsx("span", { style: { color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }, children: label }), _jsx("span", { style: { color: "var(--text)", fontVariantNumeric: "tabular-nums" }, children: valueLabel })] }), _jsx("div", { className: "distribution-track", children: _jsx("div", { className: `distribution-fill ${fillClass}`, style: { width: `${pct}%` } }) }), _jsx("div", { style: { fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }, children: caption })] }));
const DistributionSkeleton = ({ rows = 5 }) => (_jsx("div", { className: "distribution", children: Array.from({ length: rows }).map((_, i) => (_jsxs("div", { className: "distribution-row", children: [_jsx(Skeleton, { width: 100 }), _jsx(Skeleton, {}), _jsx(Skeleton, { width: 30 })] }, i))) }));
