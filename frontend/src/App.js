import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { useAuth } from "./auth/AuthProvider";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { TicketsPage } from "./pages/TicketsPage";
export const App = () => {
    const { t } = useTranslation();
    const { initialized, authenticated, login, logout } = useAuth();
    if (!initialized) {
        return _jsx("p", { children: "Loading..." });
    }
    return (_jsxs("main", { children: [_jsx("h1", { children: t("app.title") }), _jsx("p", { children: t("app.subtitle") }), _jsx(LanguageSwitcher, {}), !authenticated ? (_jsx("button", { type: "button", onClick: login, children: t("auth.login") })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: logout, children: t("auth.logout") }), _jsx(TicketsPage, {})] }))] }));
};
