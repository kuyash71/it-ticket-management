import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { parseJwtPayload } from "../lib/jwt";
import { formatActor, formatRelative } from "../lib/format";
import { Card, EmptyState, ErrorBanner, SkChart, SkKPI, SkRows, WarnBanner } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, KPI, PriorityPill, SLABar, StatusBadge, Stars, TypeBadge } from "../components/itsm/Primitives";
import { Donut, LineChart } from "../components/itsm/Charts";
import { STATUS_HEX, STATUS_META } from "../components/itsm/meta";
const OPEN_STATUSES = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"];
export const DashboardPage = ({ onOpenTicket, onNavigate, onCreateTicket }) => {
    const { token } = useAuth();
    const { isCustomer, isAgent, isManager } = useRole();
    const [tickets, setTickets] = useState(null);
    const [summary, setSummary] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [overtime, setOvertime] = useState(null);
    const [error, setError] = useState(null);
    const role = isManager() ? "MANAGER" : isAgent() ? "AGENT" : "CUSTOMER";
    const fetchAll = useCallback(async () => {
        setError(null);
        try {
            const tx = await http.get("/api/v1/tickets");
            setTickets(tx.data);
            if (role !== "CUSTOMER") {
                const sm = await http.get("/api/v1/reports/summary");
                setSummary(sm.data);
            }
            if (role === "MANAGER") {
                try {
                    const [fb, ot] = await Promise.all([
                        http.get("/api/v1/reports/feedback"),
                        http.get("/api/v1/tickets/overtime")
                    ]);
                    setFeedback(fb.data);
                    setOvertime(ot.data);
                }
                catch {
                    /* optional */
                }
            }
        }
        catch {
            setError("Veriler yüklenemedi.");
        }
    }, [role]);
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
    if (error) {
        return _jsx(ErrorBanner, { msg: error, onRetry: () => void fetchAll() });
    }
    if (role === "MANAGER") {
        return (_jsx(ManagerDashboard, { tickets: tickets, summary: summary, feedback: feedback, overtime: overtime, recent: recent, onOpenTicket: onOpenTicket, onNavigate: onNavigate }));
    }
    if (role === "AGENT") {
        return (_jsx(AgentDashboard, { tickets: tickets, summary: summary, onOpenTicket: onOpenTicket, onNavigate: onNavigate }));
    }
    return _jsx(CustomerDashboard, { tickets: tickets, recent: recent, onOpenTicket: onOpenTicket, onCreateTicket: onCreateTicket, onNavigate: onNavigate });
};
function ManagerDashboard({ tickets, summary, feedback, overtime, recent, onOpenTicket, onNavigate }) {
    const loadingSummary = summary === null;
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
            { label: "Hizmet Talebi", value: summary.byType.SERVICE_REQUEST ?? 0, color: "#2563eb" }
        ]
        : [];
    return (_jsxs("div", { className: "col gap-4", children: [_jsx("div", { className: "grid", style: { gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 14 }, children: loadingSummary ? Array.from({ length: 6 }).map((_, i) => _jsx(SkKPI, {}, i)) : summary && (_jsxs(_Fragment, { children: [_jsx(KPI, { label: "A\u00E7\u0131k Talep", value: summary.openTickets, tone: "blue", icon: "inbox", foot: "aktif kuyruk" }), _jsx(KPI, { label: "Toplam Talep", value: summary.totalTickets, tone: "purple", icon: "ticket", foot: "t\u00FCm zamanlar" }), _jsx(KPI, { label: "SLA \u0130hlal", value: summary.slaBreachCount, tone: "red", icon: "alert", alert: true, foot: "son 30 g\u00FCn" }), _jsx(KPI, { label: "\u0130hlal Oran\u0131", value: summary.slaBreachRatePercent.toFixed(1), unit: "%", tone: "orange", icon: "shield", foot: "hedef <5%" }), _jsx(KPI, { label: "Ort. \u00C7\u00F6z\u00FCm", value: summary.avgResolutionHours.toFixed(1), unit: "sa", tone: "teal", icon: "clock" }), _jsx(KPI, { label: "Ort. Puan", value: feedback ? feedback.averageRating.toFixed(1) : "—", tone: "amber", icon: "star", foot: feedback ? _jsx(Stars, { value: feedback.averageRating, size: 11 }) : "veri yok" })] })) }), _jsxs("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }, children: [_jsx(Card, { title: "Durum Da\u011F\u0131l\u0131m\u0131", children: loadingSummary ? _jsx(SkChart, { h: 180 }) : (_jsxs("div", { className: "row", style: { gap: 16, alignItems: "center" }, children: [_jsx(Donut, { data: statusData, size: 160, thickness: 26, centerSub: "toplam" }), _jsx("div", { className: "col", style: { gap: 7 }, children: statusData.map((d) => (_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "sw", style: { background: d.color } }), d.label, _jsx("b", { children: d.value })] }, d.label))) })] })) }), _jsx(Card, { title: "T\u00FCr Da\u011F\u0131l\u0131m\u0131", children: loadingSummary ? _jsx(SkChart, { h: 180 }) : (_jsxs("div", { className: "col gap-3", style: { paddingTop: 6 }, children: [_jsx(Donut, { data: typeData, size: 160, thickness: 26, centerLabel: summary?.totalTickets ?? 0, centerSub: "talep" }), _jsx("div", { className: "legend", children: typeData.map((d) => (_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "sw", style: { background: d.color } }), d.label, _jsx("b", { children: d.value })] }, d.label))) })] })) })] }), overtime && overtime.length > 0 && (_jsx(Card, { title: "S\u00FCre A\u015F\u0131m\u0131ndaki Talepler", head: _jsx("span", { className: "badge tone-red", style: { fontSize: "var(--fs-micro)" }, children: "\u00D6ncelikli" }), action: _jsx("span", { onClick: () => onNavigate({ name: "tickets" }), children: "T\u00FCm\u00FC \u2192" }), pad: false, children: _jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "Atanan" }), _jsx("th", { children: "\u00D6ncelik" }), _jsx("th", { children: "Durum" }), _jsx("th", { style: { width: 180 }, children: "SLA" })] }) }), _jsx("tbody", { children: overtime.slice(0, 5).map((t) => (_jsxs("tr", { onClick: () => onOpenTicket(t.id), children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 360 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: t.assigneeId ? _jsx(Assignee, { id: t.assigneeId, name: formatActor(t.assigneeId) }) : _jsx("span", { className: "faint", children: "\u2014" }) }), _jsx("td", { children: _jsx(PriorityPill, { priority: t.priority }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) }), _jsx("td", { children: t.sla && _jsx(SLABar, { sla: t.sla }) })] }, t.id))) })] }) })), _jsx(Card, { title: "Son Aktivite", action: _jsx("span", { onClick: () => onNavigate({ name: "tickets" }), children: "T\u00FCm\u00FC \u2192" }), pad: false, children: !tickets ? _jsx(SkRows, { n: 6 }) : recent.length === 0 ? (_jsx(EmptyState, { icon: "ticket", title: "Hen\u00FCz talep yok", body: "Sistemde aktif talep bulunmuyor." })) : (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "T\u00FCr" }), _jsx("th", { children: "Durum" }), _jsx("th", { children: "\u00D6ncelik" }), _jsx("th", { children: "G\u00FCncellendi" })] }) }), _jsx("tbody", { children: recent.map((t) => (_jsxs("tr", { onClick: () => onOpenTicket(t.id), children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 360 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: _jsx(TypeBadge, { type: t.type }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) }), _jsx("td", { children: _jsx(PriorityPill, { priority: t.priority }) }), _jsx("td", { className: "faint nowrap", children: formatRelative(t.updatedAt) })] }, t.id))) })] })) })] }));
}
function AgentDashboard({ tickets, summary, onOpenTicket, onNavigate }) {
    const { token } = useAuth();
    const myUsername = useMemo(() => {
        if (!token)
            return null;
        try {
            const p = parseJwtPayload(token);
            return (p.preferred_username ?? p.sub ?? null);
        }
        catch {
            return null;
        }
    }, [token]);
    const my = useMemo(() => (tickets ?? []).filter((t) => t.assigneeId === myUsername), [tickets, myUsername]);
    const risk = useMemo(() => (tickets ?? []).filter((t) => t.sla && ["RISK", "BREACH", "WARNING"].includes(t.sla.level) && t.status !== "CLOSED" && t.status !== "RESOLVED"), [tickets]);
    const waitingCount = my.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length;
    const resolvedToday = useMemo(() => (tickets ?? []).filter((t) => {
        if (!t.resolvedAt)
            return false;
        const r = new Date(t.resolvedAt);
        const now = new Date();
        return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth() && r.getDate() === now.getDate();
    }).length, [tickets]);
    return (_jsxs("div", { className: "col gap-4", children: [_jsx("div", { className: "grid", style: { gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }, children: tickets === null ? Array.from({ length: 4 }).map((_, i) => _jsx(SkKPI, {}, i)) : (_jsxs(_Fragment, { children: [_jsx(KPI, { label: "Bana Atanan", value: my.length, tone: "purple", icon: "inbox", foot: `${my.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL").length} yüksek öncelik` }), _jsx(KPI, { label: "M\u00FC\u015Fteri Bekliyor", value: waitingCount, tone: "orange", icon: "pause" }), _jsx(KPI, { label: "Bug\u00FCn \u00C7\u00F6z\u00FClen", value: resolvedToday, tone: "green", icon: "check" }), _jsx(KPI, { label: "SLA Riski", value: risk.length, tone: "red", icon: "alert", alert: risk.length > 0 })] })) }), _jsx(Card, { title: "SLA Riski Alt\u0131ndaki Talepler", head: _jsx("span", { className: "badge tone-orange", style: { fontSize: "var(--fs-micro)" }, children: "\u00D6ncelikli" }), action: _jsx("span", { onClick: () => onNavigate({ name: "tickets" }), children: "T\u00FCm\u00FC \u2192" }), pad: false, children: tickets === null ? _jsx(SkRows, { n: 4 }) : risk.length === 0 ? (_jsx(EmptyState, { icon: "check", title: "Risk yok", body: "SLA riski alt\u0131nda bekleyen talep bulunmuyor." })) : (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "\u00D6ncelik" }), _jsx("th", { children: "Durum" }), _jsx("th", { style: { width: 180 }, children: "SLA" }), _jsx("th", { children: "G\u00FCncellendi" })] }) }), _jsx("tbody", { children: risk.slice(0, 6).map((t) => (_jsxs("tr", { onClick: () => onOpenTicket(t.id), children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 320 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: _jsx(PriorityPill, { priority: t.priority }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) }), _jsx("td", { children: t.sla && _jsx(SLABar, { sla: t.sla }) }), _jsx("td", { className: "faint nowrap", children: formatRelative(t.updatedAt) })] }, t.id))) })] })) }), _jsxs("div", { className: "grid", style: { gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "start" }, children: [_jsx(Card, { title: "Atanan Taleplerim", action: _jsx("span", { onClick: () => onNavigate({ name: "tickets" }), children: "Hepsi" }), pad: false, children: tickets === null ? _jsx(SkRows, { n: 4 }) : my.length === 0 ? (_jsx(EmptyState, { icon: "inbox", title: "Atanan talep yok", body: "\u015Eu anda sana atanm\u0131\u015F aktif bir talep yok." })) : (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "T\u00FCr" }), _jsx("th", { children: "Durum" }), _jsx("th", { children: "G\u00FCncellendi" })] }) }), _jsx("tbody", { children: my.slice(0, 6).map((t) => (_jsxs("tr", { onClick: () => onOpenTicket(t.id), children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 240 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: _jsx(TypeBadge, { type: t.type }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) }), _jsx("td", { className: "faint nowrap", children: formatRelative(t.updatedAt) })] }, t.id))) })] })) }), _jsx(Card, { title: "Genel Durum", children: summary === null ? _jsx(SkChart, { h: 180 }) : (_jsxs("div", { className: "col gap-3", children: [_jsxs("div", { className: "row", style: { justifyContent: "space-between" }, children: [_jsxs("div", { className: "col", children: [_jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "A\u00E7\u0131k" }), _jsx("span", { className: "big-num", style: { fontSize: 24 }, children: summary.openTickets })] }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "\u00C7\u00F6z\u00FClen" }), _jsx("span", { className: "big-num", style: { fontSize: 24 }, children: summary.resolvedTotal })] }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "\u0130hlal" }), _jsx("span", { className: "big-num", style: { fontSize: 24, color: "var(--red)" }, children: summary.slaBreachCount })] })] }), _jsx("div", { className: "divider" }), _jsx(LineChart, { series: [{ name: "Açık talep", color: "#5b57d6", data: [-3, -1, -2, 0, 1, -1, 0].map((d) => Math.max(0, summary.openTickets + d)), fill: true }], width: 320, height: 120 })] })) })] })] }));
}
function CustomerDashboard({ tickets, recent, onOpenTicket, onCreateTicket, onNavigate }) {
    const active = (tickets ?? []).filter((t) => OPEN_STATUSES.includes(t.status));
    const pendingFeedback = (tickets ?? []).filter((t) => t.status === "CLOSED").length;
    return (_jsxs("div", { className: "col gap-4", children: [_jsxs("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14 }, children: [_jsxs("div", { className: "card", style: { background: "var(--accent)", border: "none", display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", color: "#fff" }, children: [_jsx("div", { style: { width: 44, height: 44, borderRadius: "var(--r-md)", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flex: "0 0 auto" }, children: _jsx(Icon, { name: "plus", size: 24, strokeWidth: 2 }) }), _jsxs("div", { className: "col", style: { gap: 2 }, children: [_jsx("span", { style: { fontWeight: 650, fontSize: 16 }, children: "Yeni Talep Olu\u015Ftur" }), _jsx("span", { style: { fontSize: "var(--fs-sm)", opacity: .85 }, children: "Sorununuzu birka\u00E7 ad\u0131mda iletin" })] }), _jsx("button", { className: "btn btn-lg", style: { marginLeft: "auto", background: "#fff", color: "var(--accent)", border: "none" }, onClick: onCreateTicket, children: "Ba\u015Fla \u2192" })] }), tickets === null ? _jsxs(_Fragment, { children: [_jsx(SkKPI, {}), _jsx(SkKPI, {})] }) : (_jsxs(_Fragment, { children: [_jsx(KPI, { label: "Aktif Taleplerim", value: active.length, tone: "purple", icon: "inbox", foot: `${active.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length} yanıt bekliyor` }), _jsx(KPI, { label: "Toplam Talebim", value: tickets.length, tone: "blue", icon: "ticket", foot: `${pendingFeedback} kapalı` })] }))] }), _jsx(Card, { title: "Son Taleplerim", action: _jsx("span", { onClick: () => onNavigate({ name: "tickets" }), children: "T\u00FCm\u00FCn\u00FC g\u00F6r \u2192" }), head: _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "Son 6" }), children: tickets === null ? (_jsx("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)", gap: 12 }, children: Array.from({ length: 3 }).map((_, i) => _jsx(SkChart, { h: 110 }, i)) })) : recent.length === 0 ? (_jsx(EmptyState, { icon: "ticket", title: "Hen\u00FCz talebiniz yok", body: "Yeni bir talep olu\u015Fturarak ba\u015Flay\u0131n.", action: _jsxs("button", { className: "btn btn-primary btn-sm", onClick: onCreateTicket, children: [_jsx(Icon, { name: "plus", size: 13 }), "Yeni Talep"] }) })) : (_jsx("div", { className: "grid", style: { gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }, children: recent.map((t) => (_jsxs("div", { className: "card card-pad", style: { cursor: "pointer" }, onClick: () => onOpenTicket(t.id), children: [_jsxs("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 9 }, children: [_jsxs("span", { className: "mono", style: { fontSize: "var(--fs-cap)", color: "var(--text-tertiary)" }, children: ["#", t.id.slice(0, 8)] }), _jsx(StatusBadge, { status: t.status, sm: true })] }), _jsx("div", { style: { fontWeight: 550, fontSize: "var(--fs-body)", marginBottom: 10, lineHeight: 1.35 }, children: t.title }), _jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx(TypeBadge, { type: t.type }), _jsx("span", { className: "faint nowrap", style: { fontSize: "var(--fs-cap)", marginLeft: "auto" }, children: formatRelative(t.updatedAt) })] })] }, t.id))) })) }), pendingFeedback > 0 && (_jsxs(WarnBanner, { action: _jsx("button", { className: "btn btn-sm banner-act", style: { borderColor: "color-mix(in srgb, var(--orange) 40%, var(--border))", color: "var(--orange)" }, onClick: () => onNavigate({ name: "tickets" }), children: "De\u011Ferlendir" }), children: [_jsxs("b", { children: [pendingFeedback, " kapal\u0131 talebiniz geri bildirim bekliyor."] }), " Hizmet kalitesini de\u011Ferlendirmek i\u00E7in t\u0131klay\u0131n."] }))] }));
}
