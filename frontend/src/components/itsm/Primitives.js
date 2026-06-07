import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from "./Icon";
import { STATUS_META, PRIORITY_META, TYPE_META, SLA_LEVEL_META, APPROVAL_META, colorFromString, initialsFromName } from "./meta";
export function StatusBadge({ status, sm }) {
    const s = STATUS_META[status];
    return (_jsxs("span", { className: "badge " + s.tone, style: sm ? { fontSize: "var(--fs-micro)", padding: "1px 7px" } : undefined, children: [_jsx(Icon, { name: s.icon, size: 11, className: "ic", strokeWidth: 2.4 }), s.label] }));
}
export function PriorityPill({ priority }) {
    const p = PRIORITY_META[priority];
    return (_jsxs("span", { className: "prio " + (priority === "CRITICAL" ? "crit" : ""), children: [_jsx("span", { className: "bar", style: { ["--tone"]: `var(--${p.tone})` } }), p.label] }));
}
export function TypeBadge({ type, icon = true }) {
    const t = TYPE_META[type];
    return (_jsxs("span", { className: "badge " + t.tone, children: [icon && _jsx(Icon, { name: t.icon, size: 11, className: "ic", strokeWidth: 2 }), t.label] }));
}
export function VisibilityPill({ vis }) {
    if (vis === "INTERNAL")
        return _jsxs("span", { className: "vis int", children: [_jsx(Icon, { name: "lock", size: 9, strokeWidth: 2.2 }), "Dahili"] });
    return _jsxs("span", { className: "vis ext", children: [_jsx(Icon, { name: "globe", size: 9, strokeWidth: 2.2 }), "Genel"] });
}
export function ApprovalPill({ state }) {
    const m = APPROVAL_META[state];
    return _jsx("span", { className: "badge " + m.tone, children: m.label });
}
export function SLABar({ sla, showMeta = true, width }) {
    const lvl = SLA_LEVEL_META[sla.level];
    const pct = Math.min(Math.max(sla.progressPercent, 0), 100);
    const remaining = formatRemaining(sla.remainingSeconds);
    return (_jsxs("div", { className: "sla " + lvl.cls + (sla.level === "BREACH" ? " breach" : ""), style: width ? { minWidth: width } : undefined, children: [_jsx("div", { className: "sla-track", children: _jsx("div", { className: "sla-fill", style: { width: pct + "%" } }) }), showMeta && (_jsxs("div", { className: "sla-meta", children: [_jsxs("span", { children: [_jsx("b", { children: lvl.label }), " \u00B7 %", Math.round(sla.progressPercent)] }), _jsx("span", { children: remaining })] }))] }));
}
function formatRemaining(secs) {
    if (secs <= 0)
        return "Aşıldı";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h >= 24)
        return Math.floor(h / 24) + "g " + (h % 24) + "sa";
    if (h > 0)
        return h + "sa " + m + "dk";
    return m + " dk";
}
export function Stars({ value, size = 14 }) {
    return (_jsx("span", { className: "stars", children: [1, 2, 3, 4, 5].map((i) => (_jsx(Icon, { name: "star", size: size, fill: i <= Math.round(value), strokeWidth: 1.6, className: i <= Math.round(value) ? "star-full" : "star-empty" }, i))) }));
}
export function Avatar({ id, name, color, size = "md", ring }) {
    const display = name || id || "?";
    const col = color || colorFromString(display);
    return _jsx("span", { className: `av av-${size} ${ring ? "av-ring" : ""}`, style: { background: col }, title: display, children: initialsFromName(display) });
}
export function Assignee({ id, name, role, sub }) {
    if (!id && !name) {
        return (_jsxs("span", { className: "row faint", style: { fontSize: "var(--fs-sm)" }, children: [_jsx("span", { className: "av av-sm", style: { background: "var(--bg-inset)", color: "var(--text-tertiary)" }, children: "?" }), "Atanmad\u0131"] }));
    }
    const display = name || id || "?";
    return (_jsxs("span", { className: "cell-assignee", children: [_jsx(Avatar, { id: id ?? undefined, name: display, size: "sm" }), _jsxs("span", { className: "col", style: { lineHeight: 1.2 }, children: [_jsx("span", { style: { fontWeight: 500 }, children: display }), sub && role && _jsx("span", { className: "sub", children: role })] })] }));
}
export function KPI({ label, value, unit, tone = "gray", icon = "sparkle", trend, foot, alert, spark }) {
    const toneVar = `var(--${tone})`;
    return (_jsxs("div", { className: "card kpi" + (alert ? " alert" : ""), style: { ["--tone"]: toneVar }, children: [_jsxs("div", { className: "kpi-head", children: [_jsx("div", { className: "kpi-ic", children: _jsx(Icon, { name: icon, size: 15, strokeWidth: 2 }) }), _jsx("div", { className: "kpi-label", children: label })] }), _jsxs("div", { className: "kpi-value tnum", children: [value, unit && _jsx("small", { children: unit })] }), _jsxs("div", { className: "kpi-foot", children: [trend && (_jsxs("span", { className: "trend " + trend.dir + (trend.good ? " good" : ""), children: [_jsx(Icon, { name: trend.dir === "down" ? "arrowdown" : trend.dir === "warn" ? "alert" : "arrowup", size: 11, strokeWidth: 2.4 }), trend.val] })), foot && _jsx("span", { children: foot })] }), spark && _jsx("div", { className: "kpi-spark", children: spark })] }));
}
export function Spark({ data, w = 56, h = 22, color = "var(--text-tertiary)" }) {
    if (data.length < 2)
        return null;
    const max = Math.max(...data), min = Math.min(...data);
    const rng = max - min || 1;
    const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / rng) * (h - 3) - 1.5}`).join(" ");
    return (_jsx("svg", { width: w, height: h, style: { display: "block" }, children: _jsx("polyline", { points: pts, fill: "none", style: { stroke: color }, strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.8" }) }));
}
