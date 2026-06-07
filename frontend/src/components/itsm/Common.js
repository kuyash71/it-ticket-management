import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon } from "./Icon";
export function Card({ title, action, children, pad = true, className = "", style, head }) {
    return (_jsxs("div", { className: "card " + className, style: style, children: [(title || head) && (_jsxs("div", { className: "card-head", children: [title && _jsx("span", { className: "card-title", children: title }), head, _jsx("span", { className: "spacer" }), action && _jsx("span", { className: "card-action", children: action })] })), _jsx("div", { className: pad ? "card-pad" : "", children: children })] }));
}
export function Legend({ items }) {
    return (_jsx("div", { className: "legend", children: items.map((it, i) => (_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "sw", style: { background: it.color } }), it.label, it.value != null && _jsx("b", { children: it.value })] }, i))) }));
}
export function Sk({ w, h = 12, r = 4, style }) {
    return _jsx("div", { className: "sk", style: { width: w, height: h, borderRadius: r, ...style } });
}
export function SkKPI() {
    return (_jsxs("div", { className: "card kpi", children: [_jsxs("div", { className: "row", style: { gap: 10, marginBottom: 4 }, children: [_jsx(Sk, { w: 28, h: 28, r: 6 }), _jsx(Sk, { w: 86, h: 10 })] }), _jsx(Sk, { w: 84, h: 26, style: { marginTop: 12 } }), _jsx(Sk, { w: 56, h: 9, style: { marginTop: 12 } })] }));
}
export function SkRows({ n = 6 }) {
    return (_jsx("div", { className: "col", children: Array.from({ length: n }).map((_, i) => (_jsxs("div", { className: "row", style: { gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--border-faint)" }, children: [_jsx(Sk, { w: 52, h: 10 }), _jsx(Sk, { w: "34%", h: 11 }), _jsx(Sk, { w: 68, h: 18, r: 9 }), _jsx(Sk, { w: 60, h: 18, r: 9 }), _jsx("span", { style: { flex: 1 } }), _jsx(Sk, { w: 90, h: 10 }), _jsx(Sk, { w: 70, h: 10 })] }, i))) }));
}
export function SkChart({ h = 180 }) {
    return _jsx("div", { className: "sk", style: { width: "100%", height: h, borderRadius: 8 } });
}
export function EmptyState({ icon = "inbox", title, body, action }) {
    return (_jsxs("div", { className: "empty", children: [_jsx("div", { className: "empty-ic", children: _jsx(Icon, { name: icon, size: 22 }) }), _jsx("h3", { children: title }), body && _jsx("p", { children: body }), action] }));
}
export function ErrorBanner({ msg = "Veriler yüklenemedi.", onRetry }) {
    return (_jsxs("div", { className: "banner error", children: [_jsx(Icon, { name: "alert", size: 16 }), _jsxs("span", { children: [_jsx("b", { children: "Ba\u011Flant\u0131 hatas\u0131." }), " ", msg] }), onRetry && (_jsxs("button", { className: "btn btn-sm btn-danger banner-act", onClick: onRetry, children: [_jsx(Icon, { name: "refresh", size: 12 }), "Yeniden dene"] }))] }));
}
export function WarnBanner({ children, action }) {
    return (_jsxs("div", { className: "banner warn", children: [_jsx(Icon, { name: "alert", size: 16 }), _jsx("span", { children: children }), action] }));
}
