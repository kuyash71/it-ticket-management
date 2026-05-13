import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { parseJwtPayload } from "../lib/jwt";
import { Avatar } from "./ui/Avatar";
import { IconBarChart, IconChevronLeft, IconChevronRight, IconInbox, IconLayoutDashboard, IconSettings } from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { LogoMark, LogoWordmark } from "./Logo";
export const Sidebar = ({ collapsed, onToggleCollapse, activeView, onNavigate }) => {
    const { t } = useTranslation();
    const { isCustomer } = useRole();
    const { token } = useAuth();
    const userName = parseUsernameFromToken(token);
    const roleLabel = useRoleLabel();
    const mainNav = [
        { id: "dashboard", label: t("nav.dashboard"), icon: _jsx(IconLayoutDashboard, {}) },
        { id: "tickets", label: t("nav.tickets"), icon: _jsx(IconInbox, {}) },
        { id: "reports", label: t("nav.reports"), icon: _jsx(IconBarChart, {}), hidden: isCustomer() }
    ];
    const secondaryNav = [
        { id: "settings", label: t("nav.settings"), icon: _jsx(IconSettings, {}) }
    ];
    return (_jsxs("aside", { className: "sidebar", "aria-label": t("nav.aria.main"), children: [_jsxs("div", { className: "sidebar-header", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("span", { className: "brand-mark", children: _jsx(LogoMark, { size: 26 }) }), !collapsed && _jsx(LogoWordmark, {})] }), !collapsed && (_jsx("button", { type: "button", className: "sidebar-collapse-toggle", onClick: onToggleCollapse, "aria-label": t("nav.collapse"), title: t("nav.collapse"), children: _jsx(IconChevronLeft, {}) })), collapsed && (_jsx("button", { type: "button", className: "sidebar-collapse-toggle", onClick: onToggleCollapse, "aria-label": t("nav.expand"), style: { position: "absolute", right: 4 }, children: _jsx(IconChevronRight, {}) }))] }), _jsxs("nav", { className: "sidebar-nav", children: [_jsx(NavGroup, { title: t("nav.section.workspace"), items: mainNav, activeView: activeView, onNavigate: onNavigate, collapsed: collapsed }), _jsx(NavGroup, { title: t("nav.section.account"), items: secondaryNav, activeView: activeView, onNavigate: onNavigate, collapsed: collapsed })] }), _jsx("div", { className: "sidebar-footer", children: _jsxs("button", { type: "button", className: "user-summary", onClick: () => onNavigate({ name: "settings" }), title: collapsed ? userName : undefined, children: [_jsx(Avatar, { name: userName }), _jsxs("div", { children: [_jsx("div", { className: "user-name", children: userName }), _jsx("div", { className: "user-role", children: roleLabel })] })] }) })] }));
};
const NavGroup = ({ title, items, activeView, onNavigate, collapsed }) => {
    const visible = items.filter((i) => !i.hidden);
    if (visible.length === 0)
        return null;
    return (_jsxs("div", { className: "nav-section", children: [_jsx("div", { className: "nav-section-title", children: title }), visible.map((item) => {
                const isActive = activeView === item.id ||
                    (activeView === "ticket-detail" && item.id === "tickets");
                const btn = (_jsxs("button", { type: "button", className: "nav-item", "aria-current": isActive ? "page" : undefined, onClick: () => onNavigate({ name: item.id }), children: [item.icon, _jsx("span", { children: item.label })] }, item.id));
                return collapsed ? (_jsx(Tooltip, { label: item.label, children: btn }, item.id)) : (btn);
            })] }));
};
const parseUsernameFromToken = (token) => {
    if (!token)
        return "User";
    try {
        const payload = parseJwtPayload(token);
        return (payload.preferred_username ??
            payload.name ??
            payload.email ??
            "User");
    }
    catch {
        return "User";
    }
};
const useRoleLabel = () => {
    const { t } = useTranslation();
    const { isManager, isAgent } = useRole();
    if (isManager())
        return t("role.manager");
    if (isAgent())
        return t("role.agent");
    return t("role.customer");
};
