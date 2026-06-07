import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Primitives";
import { useAuth } from "../../auth/AuthProvider";
export function navFor(role, counts) {
    if (role === "MANAGER") {
        return [
            { group: null, items: [
                    { id: "dashboard", label: "Genel Bakış", icon: "grid", tone: "purple", view: { name: "dashboard" } },
                    { id: "tickets", label: "Talepler", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets },
                    { id: "reports", label: "Raporlar", icon: "report", tone: "teal", view: { name: "reports" } }
                ] },
            { group: "Yönetim", items: [
                    { id: "overtime", label: "Süre Aşımı", icon: "clock", tone: "red", view: { name: "tickets", overtime: true }, count: counts?.overtime },
                    { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
                ] }
        ];
    }
    if (role === "AGENT") {
        return [
            { group: null, items: [
                    { id: "dashboard", label: "Genel Bakış", icon: "grid", tone: "purple", view: { name: "dashboard" } },
                    { id: "tickets", label: "Talepler", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets },
                    { id: "reports", label: "Raporlar", icon: "report", tone: "teal", view: { name: "reports" } }
                ] },
            { group: "Hesap", items: [
                    { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
                ] }
        ];
    }
    return [
        { group: null, items: [
                { id: "dashboard", label: "Panelim", icon: "grid", tone: "purple", view: { name: "dashboard" } },
                { id: "tickets", label: "Taleplerim", icon: "ticket", tone: "blue", view: { name: "tickets" }, count: counts?.tickets }
            ] },
        { group: "Hesap", items: [
                { id: "settings", label: "Ayarlar", icon: "settings", tone: "gray", view: { name: "settings" } }
            ] }
    ];
}
export function Sidebar({ role, userName, userRoleLabel, active, navigate, counts }) {
    const sections = navFor(role, counts);
    return (_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "brand", children: [_jsx("img", { src: "/logo.svg", alt: "ITSM", className: "brand-mark-img", width: 26, height: 26 }), _jsxs("div", { className: "col", children: [_jsx("div", { className: "brand-name", children: "ITSM" }), _jsx("div", { className: "brand-sub", children: "Destek Merkezi" })] })] }), sections.map((sec, si) => (_jsxs("div", { children: [sec.group && _jsx("div", { className: "nav-label", children: sec.group }), sec.items.map((it) => (_jsxs("div", { className: "nav-item" + (it.id === active ? " active" : ""), style: { ["--tone"]: `var(--${it.tone || "gray"})` }, onClick: () => navigate(it.view), role: "button", tabIndex: 0, onKeyDown: (e) => { if (e.key === "Enter")
                            navigate(it.view); }, children: [_jsx("span", { className: "nav-ic", children: _jsx(Icon, { name: it.icon, size: 13, strokeWidth: 2.2 }) }), _jsx("span", { className: "lbl", children: it.label }), it.count != null && _jsx("span", { className: "nav-count tnum", children: it.count })] }, it.id)))] }, si))), _jsx("div", { className: "sidebar-footer", children: _jsx(UserMenu, { userName: userName, userRoleLabel: userRoleLabel, navigate: navigate }) })] }));
}
function UserMenu({ userName, userRoleLabel, navigate }) {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);
    return (_jsxs("div", { ref: ref, style: { position: "relative" }, children: [_jsxs("div", { className: "user-chip", role: "button", tabIndex: 0, onClick: () => setOpen((o) => !o), onKeyDown: (e) => { if (e.key === "Enter")
                    setOpen((o) => !o); }, children: [_jsx(Avatar, { name: userName, size: "md" }), _jsxs("div", { className: "user-meta", children: [_jsx("div", { className: "user-name", children: userName }), _jsx("div", { className: "user-role", children: userRoleLabel })] }), _jsx(Icon, { name: "chevdown", size: 14, style: { marginLeft: "auto", color: "var(--text-tertiary)" } })] }), open && (_jsxs("div", { className: "card", style: {
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    padding: 4,
                    zIndex: 100,
                    boxShadow: "var(--shadow-pop)"
                }, children: [_jsxs("div", { role: "button", tabIndex: 0, onClick: () => { setOpen(false); navigate({ name: "settings" }); }, style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-sm)", color: "var(--text-primary)" }, onMouseEnter: (e) => (e.currentTarget.style.background = "var(--bg-hover)"), onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"), children: [_jsx(Icon, { name: "settings", size: 14 }), "Ayarlar"] }), _jsxs("div", { role: "button", tabIndex: 0, onClick: () => { setOpen(false); logout(); }, style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-sm)", color: "var(--red)" }, onMouseEnter: (e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--red) 8%, var(--bg-surface))"), onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"), children: [_jsx(Icon, { name: "logout", size: 14 }), "\u00C7\u0131k\u0131\u015F Yap"] })] }))] }));
}
export function Topbar({ title, crumb, showSearch = true, onSearchClick, actions }) {
    return (_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "col", style: { gap: 1 }, children: [crumb && _jsx("div", { className: "crumb", children: crumb }), title && _jsx("h1", { children: title })] }), _jsx("div", { className: "topbar-spacer" }), showSearch && (_jsxs("div", { className: "search", onClick: onSearchClick, role: "button", tabIndex: 0, style: { cursor: "pointer" }, children: [_jsx(Icon, { name: "search", size: 14 }), _jsx("span", { children: "Talep ara\u2026" }), _jsx("kbd", { children: "\u2318K" })] })), actions, _jsx("button", { className: "iconbtn", "aria-label": "Bildirimler", children: _jsx(Icon, { name: "bell", size: 15 }) })] }));
}
