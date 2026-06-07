import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Card } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Avatar } from "../components/itsm/Primitives";
import { parseJwtPayload } from "../lib/jwt";
function Row({ k, sub, right }) {
    return (_jsxs("div", { className: "row", style: { padding: "14px 18px", borderBottom: "1px solid var(--border-faint)", alignItems: "flex-start" }, children: [_jsxs("div", { className: "col", style: { flex: 1, gap: 2 }, children: [_jsx("span", { style: { fontWeight: 550, fontSize: "var(--fs-body)" }, children: k }), sub && _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: sub })] }), _jsx("div", { className: "row", style: { gap: 10 }, children: right })] }));
}
export const SettingsPage = () => {
    const { i18n } = useTranslation();
    const { token, roles, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const payload = token ? safeParse(token) : null;
    const name = payload?.name ?? payload?.preferred_username ?? "Kullanıcı";
    const email = payload?.email ?? "—";
    const roleLabel = roles.includes("MANAGER") ? "Yönetici" : roles.includes("AGENT") ? "Uzman" : "Müşteri";
    return (_jsxs("div", { className: "content-narrow col", style: { gap: 16, maxWidth: 820 }, children: [_jsxs(Card, { title: "G\u00F6r\u00FCn\u00FCm", pad: false, children: [_jsx(Row, { k: "Dil", sub: "Aray\u00FCz dili", right: (_jsx("div", { className: "seg", children: ["tr", "en"].map((l) => (_jsx("button", { className: i18n.language.startsWith(l) ? "on" : "", onClick: () => void i18n.changeLanguage(l), children: l.toUpperCase() }, l))) })) }), _jsx(Row, { k: "Tema", sub: "A\u00E7\u0131k veya koyu tema", right: (_jsx("div", { className: "seg", children: [["light", "Açık", "sun"], ["dark", "Koyu", "moon"], ["system", "Sistem", "settings"]].map(([id, lbl, ic]) => (_jsxs("button", { className: theme === id ? "on" : "", onClick: () => setTheme(id), children: [_jsx(Icon, { name: ic, size: 11, style: { marginRight: 5 } }), lbl] }, id))) })) })] }), _jsx(Card, { title: "Profil", head: _jsx("span", { className: "badge tone-gray", children: "Keycloak \u00B7 salt okunur" }), children: _jsxs("div", { className: "row", style: { gap: 16, padding: "6px 0" }, children: [_jsx(Avatar, { name: name, size: "lg" }), _jsxs("div", { className: "col", style: { flex: 1 }, children: [_jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("b", { style: { fontSize: "var(--fs-card)" }, children: name }), _jsx("span", { className: "badge tone-purple", children: roleLabel })] }), _jsx("span", { className: "faint", style: { fontSize: "var(--fs-sm)" }, children: email })] })] }) }), _jsxs(Card, { title: "G\u00FCvenlik", pad: false, children: [_jsx(Row, { k: "\u0130ki Fakt\u00F6rl\u00FC Do\u011Frulama (TOTP)", sub: "Authenticator uygulamas\u0131 zorunlu", right: (_jsxs("span", { className: "badge tone-green", children: [_jsx(Icon, { name: "shield", size: 11, className: "ic", strokeWidth: 2.2 }), "Aktif"] })) }), _jsx(Row, { k: "Oturum", sub: "Hesab\u0131n\u0131zdan \u00E7\u0131k\u0131\u015F yap\u0131n", right: (_jsxs("button", { className: "btn btn-danger", onClick: logout, children: [_jsx(Icon, { name: "logout", size: 13 }), "\u00C7\u0131k\u0131\u015F Yap"] })) })] })] }));
};
function safeParse(token) {
    try {
        return parseJwtPayload(token);
    }
    catch {
        return null;
    }
}
