import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import { Card, ErrorBanner, SkChart, SkKPI, SkRows } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, KPI, PriorityPill, SLABar, StatusBadge, Stars } from "../components/itsm/Primitives";
import { Donut, Gauge, HBar, RatingDist, StackedBar } from "../components/itsm/Charts";
import { STATUS_HEX, STATUS_META } from "../components/itsm/meta";
import { formatActor } from "../lib/format";
export const ReportsPage = () => {
    const { isManager } = useRole();
    const [section, setSection] = useState("summary");
    const [summary, setSummary] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [workload, setWorkload] = useState(null);
    const [overtime, setOvertime] = useState(null);
    const [error, setError] = useState(null);
    const fetchAll = useCallback(async () => {
        setError(null);
        try {
            const s = await http.get("/api/v1/reports/summary");
            setSummary(s.data);
            if (isManager()) {
                try {
                    setFeedback((await http.get("/api/v1/reports/feedback")).data);
                }
                catch { /* */ }
                try {
                    setWorkload((await http.get("/api/v1/reports/agents/workload")).data);
                }
                catch { /* */ }
                try {
                    setOvertime((await http.get("/api/v1/tickets/overtime")).data);
                }
                catch { /* */ }
            }
        }
        catch {
            setError("Raporlar yüklenemedi.");
        }
    }, [isManager]);
    useEffect(() => { void fetchAll(); }, [fetchAll]);
    const tabs = [
        { id: "summary", label: "Özet" },
        ...(isManager() ? [
            { id: "feedback", label: "Geri Bildirim" },
            { id: "workload", label: "Uzman Yükü" },
            { id: "overtime", label: "Süre Aşımı" }
        ] : [])
    ];
    return (_jsxs("div", { className: "col gap-4", children: [error && _jsx(ErrorBanner, { msg: error, onRetry: () => void fetchAll() }), _jsx("div", { className: "tabs", children: tabs.map((t) => (_jsx("div", { className: "tab " + (section === t.id ? "active" : ""), onClick: () => setSection(t.id), children: t.label }, t.id))) }), section === "summary" && _jsx(SummarySection, { summary: summary }), section === "feedback" && _jsx(FeedbackSection, { feedback: feedback }), section === "workload" && _jsx(WorkloadSection, { workload: workload }), section === "overtime" && _jsx(OvertimeSection, { overtime: overtime })] }));
};
function SummarySection({ summary }) {
    const loading = summary === null;
    const statusData = summary
        ? Object.entries(summary.byStatus).map(([k, v]) => ({
            label: STATUS_META[k]?.label ?? k,
            value: v,
            color: STATUS_HEX[k] ?? "#888"
        }))
        : [];
    const typeData = summary
        ? [
            { label: "Olay", value: summary.byType.INCIDENT ?? 0, color: "#d32f33" },
            { label: "Hizmet", value: summary.byType.SERVICE_REQUEST ?? 0, color: "#2563eb" }
        ]
        : [];
    return (_jsxs("div", { className: "col gap-4", children: [_jsx("div", { className: "grid", style: { gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 14 }, children: loading ? Array.from({ length: 6 }).map((_, i) => _jsx(SkKPI, {}, i)) : summary && (_jsxs(_Fragment, { children: [_jsx(KPI, { label: "A\u00E7\u0131k", value: summary.openTickets, tone: "blue", icon: "inbox" }), _jsx(KPI, { label: "Toplam", value: summary.totalTickets, tone: "gray", icon: "ticket" }), _jsx(KPI, { label: "\u00C7\u00F6z\u00FClen", value: summary.resolvedTotal, tone: "green", icon: "check" }), _jsx(KPI, { label: "SLA \u0130hlal", value: summary.slaBreachCount, tone: "red", icon: "alert", alert: true }), _jsx(KPI, { label: "\u0130hlal Oran\u0131", value: summary.slaBreachRatePercent.toFixed(1), unit: "%", tone: "orange", icon: "shield" }), _jsx(KPI, { label: "Ort. \u00C7\u00F6z\u00FCm", value: summary.avgResolutionHours.toFixed(1), unit: "sa", tone: "teal", icon: "clock" })] })) }), _jsxs("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "start" }, children: [_jsx(Card, { title: "Durum Da\u011F\u0131l\u0131m\u0131", children: loading ? _jsx(SkChart, { h: 180 }) : _jsx(HBar, { data: statusData, width: 320 }) }), _jsx(Card, { title: "T\u00FCr Da\u011F\u0131l\u0131m\u0131", children: loading ? _jsx(SkChart, { h: 180 }) : (_jsxs("div", { className: "col gap-3", style: { alignItems: "center" }, children: [_jsx(Donut, { data: typeData, size: 150, thickness: 26, centerLabel: summary?.totalTickets ?? 0, centerSub: "toplam" }), _jsx("div", { className: "legend", children: typeData.map((d) => (_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "sw", style: { background: d.color } }), d.label, _jsx("b", { children: d.value })] }, d.label))) })] })) }), _jsx(Card, { title: "SLA Uyum Oran\u0131", head: _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "Hedef \u2265%95" }), children: loading ? _jsx(SkChart, { h: 180 }) : summary && (_jsxs("div", { className: "col gap-2", style: { alignItems: "center" }, children: [_jsx(Gauge, { value: 100 - summary.slaBreachRatePercent, label: `%${(100 - summary.slaBreachRatePercent).toFixed(1)}`, sub: "uyum", color: "#11874a" }), _jsxs("div", { className: "row", style: { gap: 18, fontSize: "var(--fs-cap)" }, children: [_jsxs("span", { className: "row", style: { gap: 5 }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: 2, background: "#11874a" } }), _jsx("b", { className: "tnum", children: summary.resolvedTotal - summary.slaBreachCount }), _jsx("span", { className: "faint", children: "uyumlu" })] }), _jsxs("span", { className: "row", style: { gap: 5 }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: 2, background: "#d32f33" } }), _jsx("b", { className: "tnum", style: { color: "var(--red)" }, children: summary.slaBreachCount }), _jsx("span", { className: "faint", children: "ihlal" })] })] })] })) })] })] }));
}
function FeedbackSection({ feedback }) {
    const loading = feedback === null;
    return (_jsxs("div", { className: "col gap-4", children: [_jsxs("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "stretch" }, children: [_jsx(Card, { title: "Ortalama Puan", children: loading ? _jsx(SkChart, { h: 140 }) : feedback && (_jsxs("div", { className: "col", style: { gap: 6 }, children: [_jsx("div", { className: "big-num tnum", style: { fontSize: 56, color: "var(--amber)" }, children: feedback.averageRating.toFixed(1) }), _jsx(Stars, { value: feedback.averageRating, size: 18 }), _jsxs("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: [feedback.totalFeedback, " de\u011Ferlendirme \u00FCzerinden"] })] })) }), _jsx(Card, { title: "Puan Da\u011F\u0131l\u0131m\u0131", children: loading ? _jsx(SkChart, { h: 140 }) : feedback && (_jsx(RatingDist, { dist: Object.fromEntries(Object.entries(feedback.ratingDistribution).map(([k, v]) => [Number(k), Number(v)])), total: feedback.totalFeedback, width: 300 })) }), _jsx(Card, { title: "Toplam Geri Bildirim", children: loading ? _jsx(SkChart, { h: 140 }) : feedback && (_jsxs("div", { className: "col gap-3", children: [_jsx("div", { className: "big-num tnum", children: feedback.totalFeedback }), _jsx("div", { className: "faint", style: { fontSize: "var(--fs-sm)" }, children: "kapanan talepler \u00FCzerinden al\u0131nan" })] })) })] }), _jsx(Card, { title: "Uzman Baz\u0131nda Geri Bildirim", pad: false, children: loading ? _jsx(SkRows, { n: 4 }) : feedback && feedback.perAgent.length === 0 ? (_jsx("p", { className: "faint", style: { padding: 16, fontSize: "var(--fs-sm)" }, children: "Hen\u00FCz veri yok." })) : feedback && (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Uzman" }), _jsx("th", { children: "Talep Say\u0131s\u0131" }), _jsx("th", { children: "Ortalama" }), _jsx("th", { style: { width: 200 }, children: "Puan" })] }) }), _jsx("tbody", { children: feedback.perAgent.map((a) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx(Assignee, { id: a.agentId, name: formatActor(a.agentId) }) }), _jsx("td", { className: "tnum", children: a.count }), _jsx("td", { children: _jsx("span", { className: "tnum", style: { fontWeight: 600 }, children: a.averageRating.toFixed(1) }) }), _jsx("td", { children: _jsx(Stars, { value: a.averageRating }) })] }, a.agentId))) })] })) })] }));
}
function WorkloadSection({ workload }) {
    const loading = workload === null;
    const cats = workload ? workload.agents.map((a) => ({
        label: formatActor(a.agentId).slice(0, 12),
        total: a.total,
        values: a.byStatus
    })) : [];
    const keys = [
        { id: "NEW", label: "Yeni", color: STATUS_HEX.NEW },
        { id: "IN_PROGRESS", label: "İşlemde", color: STATUS_HEX.IN_PROGRESS },
        { id: "WAITING_FOR_CUSTOMER", label: "Müşteri", color: STATUS_HEX.WAITING_FOR_CUSTOMER },
        { id: "RESOLVED", label: "Çözüldü", color: STATUS_HEX.RESOLVED }
    ];
    const sorted = workload ? [...workload.agents].sort((a, b) => b.total - a.total) : [];
    return (_jsxs("div", { className: "col gap-4", children: [_jsxs("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }, children: [_jsx(Card, { title: "En Y\u00FCkl\u00FC", children: loading || !sorted.length ? _jsx(SkChart, { h: 80 }) : (_jsxs("div", { className: "row", style: { gap: 10 }, children: [_jsx(Assignee, { id: sorted[0].agentId, name: formatActor(sorted[0].agentId), sub: true, role: "Uzman" }), _jsx("span", { className: "badge tone-red", style: { marginLeft: "auto" }, children: sorted[0].total })] })) }), _jsx(Card, { title: "En Az Y\u00FCkl\u00FC", children: loading || !sorted.length ? _jsx(SkChart, { h: 80 }) : (_jsxs("div", { className: "row", style: { gap: 10 }, children: [_jsx(Assignee, { id: sorted[sorted.length - 1].agentId, name: formatActor(sorted[sorted.length - 1].agentId), sub: true, role: "Uzman" }), _jsx("span", { className: "badge tone-green", style: { marginLeft: "auto" }, children: sorted[sorted.length - 1].total })] })) }), _jsx(Card, { title: "Ortalama", children: loading ? _jsx(SkChart, { h: 80 }) : workload && (_jsxs("div", { className: "row", style: { gap: 12 }, children: [_jsx("div", { className: "kpi-ic", style: { width: 36, height: 36, ["--tone"]: "var(--teal)" }, children: _jsx(Icon, { name: "users", size: 18 }) }), _jsxs("div", { className: "col", children: [_jsx("div", { className: "big-num tnum", children: workload.agents.length ? (workload.agents.reduce((s, a) => s + a.total, 0) / workload.agents.length).toFixed(1) : "0" }), _jsx("div", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "uzman ba\u015F\u0131na aktif" })] })] })) })] }), _jsx(Card, { title: "Uzman Y\u00FCk\u00FC", head: _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "Durum baz\u0131nda" }), children: loading ? _jsx(SkChart, { h: 220 }) : cats.length === 0 ? (_jsx("p", { className: "faint", style: { fontSize: "var(--fs-sm)" }, children: "Veri yok." })) : (_jsxs("div", { className: "col gap-3", children: [_jsx(StackedBar, { categories: cats, keys: keys, width: 1000, height: 220 }), _jsx("div", { className: "legend", children: keys.map((k) => (_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "sw", style: { background: k.color } }), k.label] }, k.id))) })] })) }), _jsx(Card, { title: "Uzman Detay", pad: false, children: loading ? _jsx(SkRows, { n: 4 }) : workload && workload.agents.length === 0 ? (_jsx("p", { className: "faint", style: { padding: 16, fontSize: "var(--fs-sm)" }, children: "Hen\u00FCz veri yok." })) : workload && (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Uzman" }), _jsx("th", { children: "Toplam" }), _jsx("th", { children: "Yeni" }), _jsx("th", { children: "\u0130\u015Flemde" }), _jsx("th", { children: "M\u00FC\u015Fteri Bekliyor" }), _jsx("th", { children: "\u00C7\u00F6z\u00FCld\u00FC" })] }) }), _jsx("tbody", { children: workload.agents.map((a) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx(Assignee, { id: a.agentId, name: formatActor(a.agentId), sub: true, role: "Uzman" }) }), _jsx("td", { children: _jsx("b", { className: "tnum", children: a.total }) }), _jsx("td", { className: "tnum", children: a.byStatus.NEW || 0 }), _jsx("td", { className: "tnum", children: _jsx("span", { style: { color: STATUS_HEX.IN_PROGRESS, fontWeight: 600 }, children: a.byStatus.IN_PROGRESS || 0 }) }), _jsx("td", { className: "tnum", children: a.byStatus.WAITING_FOR_CUSTOMER || 0 }), _jsx("td", { className: "tnum", children: a.byStatus.RESOLVED || 0 })] }, a.agentId))) })] })) })] }));
}
function OvertimeSection({ overtime }) {
    const loading = overtime === null;
    const breach = overtime?.filter((t) => t.sla?.level === "BREACH") ?? [];
    const risk = overtime?.filter((t) => t.sla?.level === "RISK") ?? [];
    const warn = overtime?.filter((t) => t.sla?.level === "WARNING") ?? [];
    return (_jsxs("div", { className: "col gap-4", children: [overtime && overtime.length > 0 && (_jsx(ErrorBanner, { msg: `${overtime.length} talep süre aşımında veya risk altında.` })), _jsxs("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }, children: [_jsx(KPI, { label: "S\u00FCre A\u015F\u0131m\u0131", value: breach.length, tone: "red", icon: "alert", alert: breach.length > 0, foot: "aktif" }), _jsx(KPI, { label: "Risk (>85%)", value: risk.length, tone: "orange", icon: "clock", foot: "m\u00FCdahale gerekli" }), _jsx(KPI, { label: "Uyar\u0131 (>70%)", value: warn.length, tone: "amber", icon: "info", foot: "izlemede" })] }), _jsx(Card, { title: "S\u00FCre A\u015F\u0131m\u0131ndaki Talepler", pad: false, children: loading ? _jsx(SkRows, { n: 4 }) : !overtime?.length ? (_jsx("p", { className: "faint", style: { padding: 16, fontSize: "var(--fs-sm)" }, children: "\u015Eu anda risk alt\u0131ndaki talep yok." })) : (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "Uzman" }), _jsx("th", { children: "\u00D6ncelik" }), _jsx("th", { style: { width: 170 }, children: "SLA" }), _jsx("th", { children: "Durum" })] }) }), _jsx("tbody", { children: overtime.map((t) => (_jsxs("tr", { children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 360 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: t.assigneeId ? _jsx(Assignee, { id: t.assigneeId, name: formatActor(t.assigneeId) }) : _jsx("span", { className: "faint", children: "\u2014" }) }), _jsx("td", { children: _jsx(PriorityPill, { priority: t.priority }) }), _jsx("td", { children: t.sla && _jsx(SLABar, { sla: t.sla }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) })] }, t.id))) })] })) })] }));
}
