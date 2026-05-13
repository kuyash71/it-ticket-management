import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { parseJwtPayload } from "../lib/jwt";
import { Avatar } from "./ui/Avatar";
import { DropdownMenu } from "./ui/DropdownMenu";
import { IconBell, IconLogOut, IconMoon, IconSearch, IconSettings, IconSun, IconUser } from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { useTheme } from "../theme/ThemeProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
export const Topbar = ({ onOpenCommand, onNavigate }) => {
    const { t } = useTranslation();
    const { logout, token } = useAuth();
    const { roles } = useRole();
    const { resolved, setTheme } = useTheme();
    const userName = parseUsername(token);
    const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");
    return (_jsxs("header", { className: "topbar", role: "banner", children: [_jsxs("button", { type: "button", className: "topbar-search", onClick: onOpenCommand, "aria-label": t("command.open"), children: [_jsx(IconSearch, {}), _jsx("span", { className: "topbar-search-placeholder", children: t("command.placeholder") }), _jsx("span", { className: "kbd", children: "\u2318K" })] }), _jsxs("div", { className: "topbar-actions", children: [_jsx(LanguageSwitcher, {}), _jsx(Tooltip, { label: resolved === "dark" ? t("theme.light") : t("theme.dark"), children: _jsx("button", { type: "button", className: "btn btn--ghost btn--icon btn--sm", onClick: toggleTheme, "aria-label": t("theme.toggle"), children: resolved === "dark" ? _jsx(IconSun, {}) : _jsx(IconMoon, {}) }) }), _jsx(Tooltip, { label: t("nav.notifications"), children: _jsx("button", { type: "button", className: "btn btn--ghost btn--icon btn--sm", "aria-label": t("nav.notifications"), children: _jsx(IconBell, {}) }) }), _jsx("div", { className: "topbar-divider", "aria-hidden": "true" }), _jsx(DropdownMenu, { align: "end", trigger: _jsxs("button", { type: "button", className: "btn btn--ghost btn--sm", style: { paddingLeft: 4, paddingRight: 8, gap: 8 }, "aria-label": userName, children: [_jsx(Avatar, { name: userName, size: "sm" }), _jsx("span", { style: { fontSize: "var(--text-sm)" }, children: userName })] }), items: [
                            { key: "label", label: roles.join(", ") || "User", label_only: true },
                            { key: "settings", label: t("nav.settings"), icon: _jsx(IconSettings, {}), onSelect: () => onNavigate({ name: "settings" }) },
                            { key: "profile", label: t("settings.profile"), icon: _jsx(IconUser, {}), onSelect: () => onNavigate({ name: "settings" }) },
                            { key: "div1", divider: true },
                            { key: "logout", label: t("auth.logout"), icon: _jsx(IconLogOut, {}), danger: true, onSelect: logout }
                        ] })] })] }));
};
const parseUsername = (token) => {
    if (!token)
        return "User";
    try {
        const payload = parseJwtPayload(token);
        return (payload.preferred_username ?? payload.name ?? payload.email ?? "User");
    }
    catch {
        return "User";
    }
};
