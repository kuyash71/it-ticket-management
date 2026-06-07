import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Icon } from "./Icon";
function useTip() {
    const [tip, setTip] = useState(null);
    const ref = useRef(null);
    const node = tip && (_jsx("div", { className: "chart-tip", style: { left: tip.x, top: tip.y, opacity: 1 }, dangerouslySetInnerHTML: { __html: tip.html } }));
    return { tip, setTip, ref, node };
}
const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function arcPath(cx, cy, rOut, rIn, a0, a1) {
    const [x0, y0] = polar(cx, cy, rOut, a0), [x1, y1] = polar(cx, cy, rOut, a1);
    const [x2, y2] = polar(cx, cy, rIn, a1), [x3, y3] = polar(cx, cy, rIn, a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x0} ${y0}A${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3}Z`;
}
export function Donut({ data, size = 168, thickness = 26, centerLabel, centerSub }) {
    const { setTip, ref, node } = useTip();
    const [hi, setHi] = useState(null);
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = size / 2, cy = size / 2, rOut = size / 2 - 2, rIn = rOut - thickness;
    let ang = -Math.PI / 2;
    const segs = data.map((d) => {
        const a0 = ang, a1 = ang + (d.value / total) * Math.PI * 2;
        ang = a1;
        return { ...d, a0, a1 };
    });
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { width: size, height: size, position: "relative" }, children: [_jsxs("svg", { width: size, height: size, children: [_jsx("circle", { cx: cx, cy: cy, r: (rOut + rIn) / 2, fill: "none", stroke: "rgba(140,145,160,0.14)", strokeWidth: thickness }), segs.map((s, i) => {
                        const grow = hi === i ? 2 : 0;
                        return (_jsx("path", { d: arcPath(cx, cy, rOut + grow, rIn - grow, s.a0, s.a1), style: { fill: s.color, transition: "opacity .12s", cursor: "pointer" }, opacity: hi === null || hi === i ? 1 : 0.3, onMouseEnter: () => setHi(i), onMouseMove: (e) => {
                                const r = ref.current.getBoundingClientRect();
                                setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${s.label}</b> · ${s.value} <span style="opacity:.7">(%${Math.round(s.value / total * 100)})</span>` });
                            }, onMouseLeave: () => { setHi(null); setTip(null); } }, i));
                    })] }), _jsx("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }, children: _jsxs("div", { style: { textAlign: "center" }, children: [_jsx("div", { className: "big-num tnum", style: { fontSize: 26 }, children: centerLabel ?? total }), centerSub && _jsx("div", { className: "faint", style: { fontSize: "var(--fs-cap)", marginTop: 2 }, children: centerSub })] }) }), node] }));
}
export function LineChart({ series, width = 560, height = 180, pad = 26, yMax, fmt = (v) => String(v), xLabels }) {
    const { setTip, ref, node } = useTip();
    const [hx, setHx] = useState(null);
    if (!series.length || !series[0].data.length) {
        return _jsx("div", { className: "sk", style: { height, width: "100%", borderRadius: 8 } });
    }
    const n = series[0].data.length;
    const max = yMax || Math.max(...series.flatMap((s) => s.data)) * 1.15 || 1;
    const X = (i) => pad + (i / (n - 1 || 1)) * (width - pad * 2);
    const Y = (v) => height - pad - (v / max) * (height - pad * 2);
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { position: "relative" }, children: [_jsxs("svg", { width: width, height: height, onMouseMove: (e) => {
                    const r = ref.current.getBoundingClientRect();
                    const mx = e.clientX - r.left;
                    let i = Math.round(((mx - pad) / (width - pad * 2)) * (n - 1));
                    i = Math.max(0, Math.min(n - 1, i));
                    setHx(i);
                    setTip({ x: X(i), y: 6, html: (xLabels ? `<span style="opacity:.7">${xLabels[i]}</span><br/>` : "") + series.map((s) => `<span style="color:${s.color}">●</span> ${s.name} <b>${fmt(s.data[i])}</b>`).join("&nbsp;&nbsp;") });
                }, onMouseLeave: () => { setHx(null); setTip(null); }, children: [gridY.map((g, i) => (_jsxs("g", { children: [_jsx("line", { x1: pad, x2: width - pad, y1: Y(g), y2: Y(g), style: { stroke: "rgba(140,145,160,0.16)" }, strokeWidth: "1" }), _jsx("text", { x: pad - 6, y: Y(g) + 3, textAnchor: "end", fontSize: "9.5", style: { fill: "var(--text-tertiary)" }, children: Math.round(g) })] }, i))), series.map((s, si) => {
                        const line = s.data.map((v, i) => `${i === 0 ? "M" : "L"}${X(i)} ${Y(v)}`).join(" ");
                        const area = line + `L${X(n - 1)} ${height - pad}L${X(0)} ${height - pad}Z`;
                        return (_jsxs("g", { children: [s.fill && _jsx("path", { d: area, style: { fill: s.color }, opacity: "0.1" }), _jsx("path", { d: line, fill: "none", style: { stroke: s.color }, strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" })] }, si));
                    }), hx !== null && (_jsxs("g", { children: [_jsx("line", { x1: X(hx), x2: X(hx), y1: pad - 6, y2: height - pad, style: { stroke: "rgba(140,145,160,0.5)" }, strokeWidth: "1", strokeDasharray: "3 3" }), series.map((s, si) => _jsx("circle", { cx: X(hx), cy: Y(s.data[hx]), r: "3.5", style: { fill: "var(--bg-surface)", stroke: s.color }, strokeWidth: "2.4" }, si))] }))] }), node] }));
}
export function HBar({ data, width = 320, barH = 22, gap = 12, valueFmt = (v) => String(v) }) {
    const { setTip, ref, node } = useTip();
    if (!data.length)
        return _jsxs("div", { className: "empty", children: [_jsx(Icon, { name: "info", size: 18 }), _jsx("p", { children: "Veri yok" })] });
    const max = Math.max(...data.map((d) => d.value)) || 1;
    const labelW = 124, trackW = width - labelW - 44;
    const height = data.length * (barH + gap) - gap;
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { position: "relative" }, children: [_jsx("svg", { width: width, height: height, children: data.map((d, i) => {
                    const y = i * (barH + gap);
                    const w = Math.max(4, (d.value / max) * trackW);
                    return (_jsxs("g", { style: { cursor: "pointer" }, onMouseMove: (e) => { const r = ref.current.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${d.label}</b> · ${valueFmt(d.value)}` }); }, onMouseLeave: () => setTip(null), children: [d.icon && _jsx("circle", { cx: 5, cy: y + barH / 2, r: "3.5", style: { fill: d.color } }), _jsx("text", { x: d.icon ? 14 : 0, y: y + barH / 2 + 4, fontSize: "11.5", fontWeight: "500", style: { fill: "var(--text-secondary)" }, children: d.label }), _jsx("rect", { x: labelW, y: y, width: trackW, height: barH, rx: "5", style: { fill: "rgba(140,145,160,0.16)" } }), _jsx("rect", { x: labelW, y: y, width: w, height: barH, rx: "5", style: { fill: d.color } }), _jsx("text", { x: labelW + w + 8, y: y + barH / 2 + 4, fontSize: "11.5", fontWeight: "700", style: { fill: "var(--text-primary)" }, children: valueFmt(d.value) })] }, i));
                }) }), node] }));
}
export function StackedBar({ categories, keys, width = 520, height = 200, pad = 30 }) {
    const { setTip, ref, node } = useTip();
    const max = Math.max(...categories.map((c) => keys.reduce((s, k) => s + (c.values[k.id] || 0), 0))) || 1;
    const bw = Math.min(48, (width - pad * 2) / categories.length - 18);
    const step = (width - pad * 2) / categories.length;
    const Y = (v) => (v / max) * (height - pad * 2);
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { position: "relative" }, children: [_jsxs("svg", { width: width, height: height, children: [[0, 0.5, 1].map((t, i) => (_jsx("line", { x1: pad, x2: width - pad, y1: height - pad - t * (height - pad * 2), y2: height - pad - t * (height - pad * 2), style: { stroke: "rgba(140,145,160,0.16)" } }, i))), categories.map((c, ci) => {
                        const x = pad + ci * step + (step - bw) / 2;
                        let yCursor = height - pad;
                        return (_jsxs("g", { children: [keys.map((k) => {
                                    const v = c.values[k.id] || 0;
                                    if (!v)
                                        return null;
                                    const h = Y(v);
                                    yCursor -= h;
                                    const yy = yCursor;
                                    return (_jsx("rect", { x: x, y: yy + 1, width: bw, height: Math.max(0, h - 1.5), rx: "2.5", style: { fill: k.color, cursor: "pointer" }, onMouseMove: (e) => { const r = ref.current.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${c.label}</b><br/>${k.label}: <b>${v}</b>` }); }, onMouseLeave: () => setTip(null) }, k.id));
                                }), _jsx("text", { x: x + bw / 2, y: height - pad + 15, textAnchor: "middle", fontSize: "11", fontWeight: "500", style: { fill: "var(--text-secondary)" }, children: c.label }), _jsx("text", { x: x + bw / 2, y: yCursor - 6, textAnchor: "middle", fontSize: "11.5", fontWeight: "700", style: { fill: "var(--text-primary)" }, children: c.total })] }, ci));
                    })] }), node] }));
}
export function Gauge({ value, size = 168, thickness = 16, color = "#138a44", label, sub }) {
    const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2 - 2;
    const a0 = Math.PI, a1 = Math.PI * 2;
    const frac = Math.min(value, 100) / 100;
    const aV = a0 + frac * Math.PI;
    const track = `M${polar(cx, cy, r, a0).join(" ")}A${r} ${r} 0 0 1 ${polar(cx, cy, r, a1).join(" ")}`;
    const fill = `M${polar(cx, cy, r, a0).join(" ")}A${r} ${r} 0 0 1 ${polar(cx, cy, r, aV).join(" ")}`;
    return (_jsxs("div", { style: { width: size, height: size / 2 + 20, position: "relative" }, children: [_jsxs("svg", { width: size, height: size / 2 + 20, children: [_jsx("path", { d: track, fill: "none", style: { stroke: "rgba(140,145,160,0.18)" }, strokeWidth: thickness, strokeLinecap: "round" }), _jsx("path", { d: fill, fill: "none", style: { stroke: color }, strokeWidth: thickness, strokeLinecap: "round" })] }), _jsxs("div", { style: { position: "absolute", left: 0, right: 0, top: size / 2 - 26, textAlign: "center" }, children: [_jsx("div", { className: "big-num tnum", style: { fontSize: 28, color }, children: label }), sub && _jsx("div", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: sub })] })] }));
}
export function RatingDist({ dist, total, width = 280 }) {
    const { setTip, ref, node } = useTip();
    const max = Math.max(...Object.values(dist)) || 1;
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { position: "relative", display: "flex", flexDirection: "column", gap: 8, width }, children: [[5, 4, 3, 2, 1].map((star) => {
                const v = dist[star] || 0;
                return (_jsxs("div", { className: "row", style: { gap: 9 }, onMouseMove: (e) => { const r = ref.current.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `${star}★ · <b>${v}</b> (%${total ? Math.round(v / total * 100) : 0})` }); }, onMouseLeave: () => setTip(null), children: [_jsxs("span", { className: "row", style: { gap: 2, width: 30, fontSize: "var(--fs-cap)", color: "var(--text-secondary)", fontWeight: 700 }, children: [star, _jsx(Icon, { name: "star", size: 10, fill: true, className: "star-full" })] }), _jsx("div", { className: "sla-track", style: { flex: 1, height: 8 }, children: _jsx("div", { className: "sla-fill", style: { width: (v / max * 100) + "%", background: "var(--amber)" } }) }), _jsx("span", { className: "tnum", style: { width: 24, textAlign: "right", fontSize: "var(--fs-cap)", color: "var(--text-secondary)", fontWeight: 600 }, children: v })] }, star));
            }), node] }));
}
export function AreaChart({ data, labels, width = 720, height = 200, pad = 30, color = "#5b57d6", fmt = (v) => String(v), threshold, thresholdLabel }) {
    const { setTip, ref, node } = useTip();
    const [hx, setHx] = useState(null);
    if (!data.length)
        return _jsx("div", { className: "sk", style: { height, width: "100%", borderRadius: 8 } });
    const n = data.length;
    const max = Math.max(...data) * 1.18 || 1;
    const X = (i) => pad + (i / (n - 1 || 1)) * (width - pad * 2);
    const Y = (v) => height - pad - (v / max) * (height - pad * 2);
    const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${X(i)} ${Y(v)}`).join(" ");
    const area = line + `L${X(n - 1)} ${height - pad}L${X(0)} ${height - pad}Z`;
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    return (_jsxs("div", { className: "chart-wrap", ref: ref, style: { position: "relative" }, children: [_jsxs("svg", { width: width, height: height, onMouseMove: (e) => { const r = ref.current.getBoundingClientRect(); const mx = e.clientX - r.left; let i = Math.round(((mx - pad) / (width - pad * 2)) * (n - 1)); i = Math.max(0, Math.min(n - 1, i)); setHx(i); setTip({ x: X(i), y: 4, html: `${labels ? labels[i] + "<br/>" : ""}<b>${fmt(data[i])}</b>` }); }, onMouseLeave: () => { setHx(null); setTip(null); }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gid, x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.34" }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })] }) }), gridY.map((g, i) => _jsxs("g", { children: [_jsx("line", { x1: pad, x2: width - pad, y1: Y(g), y2: Y(g), style: { stroke: "rgba(140,145,160,0.16)" } }), _jsx("text", { x: pad - 6, y: Y(g) + 3, textAnchor: "end", fontSize: "9.5", style: { fill: "var(--text-tertiary)" }, children: Math.round(g) })] }, i)), threshold != null && (_jsxs(_Fragment, { children: [_jsx("line", { x1: pad, x2: width - pad, y1: Y(threshold), y2: Y(threshold), style: { stroke: "#d12830" }, strokeWidth: "1.2", strokeDasharray: "4 4" }), thresholdLabel && _jsx("text", { x: width - pad, y: Y(threshold) - 5, textAnchor: "end", fontSize: "9.5", fontWeight: "600", style: { fill: "#d12830" }, children: thresholdLabel })] })), _jsx("path", { d: area, fill: `url(#${gid})` }), _jsx("path", { d: line, fill: "none", style: { stroke: color }, strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" }), hx !== null && _jsxs("g", { children: [_jsx("line", { x1: X(hx), x2: X(hx), y1: pad - 4, y2: height - pad, style: { stroke: "rgba(140,145,160,0.5)" }, strokeWidth: "1", strokeDasharray: "3 3" }), _jsx("circle", { cx: X(hx), cy: Y(data[hx]), r: "4", style: { fill: "var(--bg-surface)", stroke: color }, strokeWidth: "2.4" })] })] }), node] }));
}
