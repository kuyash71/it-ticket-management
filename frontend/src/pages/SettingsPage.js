import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { IconBell, IconGlobe, IconLogOut, IconSun, IconUser } from "../components/ui/Icon";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ui/ThemeToggle";
export const SettingsPage = () => {
    const { t } = useTranslation();
    const { token, logout } = useAuth();
    const { isManager, isAgent } = useRole();
    const [section, setSection] = useState("profile");
    const profile = useMemo(() => parseProfile(token), [token]);
    const roleLabel = isManager() ? t("role.manager") : isAgent() ? t("role.agent") : t("role.customer");
    const sections = [
        { id: "profile", label: t("settings.profile"), icon: _jsx(IconUser, {}) },
        { id: "preferences", label: t("settings.preferences"), icon: _jsx(IconSun, {}) },
        { id: "notifications", label: t("settings.notifications"), icon: _jsx(IconBell, {}) }
    ];
    return (_jsxs("div", { className: "page-container", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { className: "page-title", children: t("nav.settings") }), _jsx("p", { className: "page-subtitle", children: t("settings.subtitle") })] }) }), _jsxs("div", { className: "settings-shell", children: [_jsx("nav", { className: "settings-nav", "aria-label": t("settings.nav.aria"), children: sections.map((s) => (_jsxs("button", { type: "button", className: "nav-item", "aria-current": section === s.id ? "page" : undefined, onClick: () => setSection(s.id), children: [s.icon, _jsx("span", { children: s.label })] }, s.id))) }), _jsxs("div", { children: [section === "profile" && (_jsx(ProfileSection, { profile: profile, roleLabel: roleLabel, onLogout: logout })), section === "preferences" && _jsx(PreferencesSection, {}), section === "notifications" && _jsx(NotificationsSection, {})] })] })] }));
};
const ProfileSection = ({ profile, roleLabel, onLogout }) => {
    const { t } = useTranslation();
    return (_jsxs(_Fragment, { children: [_jsxs(SettingsCard, { title: t("settings.profile"), description: t("settings.profile.desc"), children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-4)" }, children: [_jsx(Avatar, { name: profile.name || profile.username, size: "xl" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx("div", { style: { fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)" }, children: profile.name || profile.username }), _jsx("div", { className: "text-sm text-muted", children: profile.email }), _jsx("div", { className: "text-xs text-muted", style: { marginTop: 4 }, children: _jsx("span", { className: "badge badge--sm", children: roleLabel }) })] })] }), _jsx(ReadOnlyField, { label: t("settings.profile.username"), value: profile.username }), _jsx(ReadOnlyField, { label: t("settings.profile.email"), value: profile.email || "—" }), _jsx(ReadOnlyField, { label: t("settings.profile.fullname"), value: profile.name || "—" }), _jsx("p", { className: "text-xs text-muted", children: t("settings.profile.managed_by_keycloak") })] }), _jsx(SettingsCard, { title: t("settings.session"), description: t("settings.session.desc"), children: _jsxs("div", { className: "settings-row", children: [_jsxs("div", { className: "settings-row-label", children: [_jsx("div", { className: "settings-row-title", children: t("auth.logout") }), _jsx("div", { className: "settings-row-description", children: t("settings.session.logout_desc") })] }), _jsx(Button, { variant: "danger", leadingIcon: _jsx(IconLogOut, {}), onClick: onLogout, children: t("auth.logout") })] }) })] }));
};
const PreferencesSection = () => {
    const { t } = useTranslation();
    return (_jsxs(SettingsCard, { title: t("settings.preferences"), description: t("settings.preferences.desc"), children: [_jsxs("div", { className: "settings-row", children: [_jsxs("div", { className: "settings-row-label", children: [_jsx("div", { className: "settings-row-title", children: t("theme.title") }), _jsx("div", { className: "settings-row-description", children: t("settings.theme.desc") })] }), _jsx(ThemeToggle, {})] }), _jsxs("div", { className: "settings-row", children: [_jsxs("div", { className: "settings-row-label", children: [_jsx("div", { className: "settings-row-title", children: _jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [_jsx(IconGlobe, {}), " ", t("settings.language")] }) }), _jsx("div", { className: "settings-row-description", children: t("settings.language.desc") })] }), _jsx(LanguageSwitcher, {})] })] }));
};
const NotificationsSection = () => {
    const { t } = useTranslation();
    return (_jsx(SettingsCard, { title: t("settings.notifications"), description: t("settings.notifications.desc"), children: _jsx("p", { className: "text-sm text-muted", children: t("settings.notifications.coming_soon") }) }));
};
const SettingsCard = ({ title, description, children }) => (_jsxs("section", { className: "settings-section", children: [_jsxs("header", { className: "settings-section-header", children: [_jsx("div", { className: "settings-section-title", children: title }), description && _jsx("div", { className: "settings-section-description", children: description })] }), _jsx("div", { className: "settings-section-body", children: children })] }));
const ReadOnlyField = ({ label, value }) => (_jsxs("div", { className: "settings-row", children: [_jsx("div", { className: "settings-row-label", children: _jsx("div", { className: "settings-row-title", children: label }) }), _jsx("div", { className: "text-sm", style: { color: "var(--text-secondary)", fontFamily: label.toLowerCase().includes("id") ? "var(--font-mono)" : undefined }, children: value })] }));
function parseProfile(token) {
    if (!token)
        return { name: "", email: "", username: "User" };
    try {
        const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
        return {
            name: payload.name ?? `${payload.given_name ?? ""} ${payload.family_name ?? ""}`.trim(),
            email: payload.email ?? "",
            username: payload.preferred_username ?? payload.email ?? "User"
        };
    }
    catch {
        return { name: "", email: "", username: "User" };
    }
}
