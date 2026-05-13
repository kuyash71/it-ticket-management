import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./auth/AuthProvider";
import { useRole } from "./auth/useRole";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { CommandPalette } from "./components/ui/CommandPalette";
import { IconBarChart, IconInbox, IconLayoutDashboard, IconLogOut, IconMoon, IconPlus, IconSettings, IconSun } from "./components/ui/Icon";
import { LoadingState } from "./components/ui/Spinner";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketsPage } from "./pages/TicketsPage";
import { useTheme } from "./theme/ThemeProvider";
import "./styles/globals.css";
const SIDEBAR_KEY = "itsm.sidebar.collapsed";
export const App = () => {
    const { t } = useTranslation();
    const { initialized, logout } = useAuth();
    const { isCustomer } = useRole();
    const { resolved, setTheme } = useTheme();
    const [view, setView] = useState({ name: "dashboard" });
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "1");
    const [commandOpen, setCommandOpen] = useState(false);
    const [createTicketOpen, setCreateTicketOpen] = useState(false);
    const toggleCollapse = useCallback(() => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
            return next;
        });
    }, []);
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCommandOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);
    if (!initialized) {
        return (_jsx("div", { style: { height: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }, children: _jsx(LoadingState, { text: t("app.loading") }) }));
    }
    const activeView = view.name === "ticket-detail" ? "tickets" : view.name;
    const navigate = (next) => setView(next);
    const commands = [
        {
            key: "nav.dashboard",
            label: t("nav.dashboard"),
            group: t("command.group.navigate"),
            icon: _jsx(IconLayoutDashboard, {}),
            onSelect: () => navigate({ name: "dashboard" })
        },
        {
            key: "nav.tickets",
            label: t("nav.tickets"),
            group: t("command.group.navigate"),
            icon: _jsx(IconInbox, {}),
            onSelect: () => navigate({ name: "tickets" })
        },
        ...(isCustomer()
            ? []
            : [
                {
                    key: "nav.reports",
                    label: t("nav.reports"),
                    group: t("command.group.navigate"),
                    icon: _jsx(IconBarChart, {}),
                    onSelect: () => navigate({ name: "reports" })
                }
            ]),
        {
            key: "nav.settings",
            label: t("nav.settings"),
            group: t("command.group.navigate"),
            icon: _jsx(IconSettings, {}),
            onSelect: () => navigate({ name: "settings" })
        },
        {
            key: "action.create-ticket",
            label: t("ticket.create"),
            group: t("command.group.actions"),
            icon: _jsx(IconPlus, {}),
            onSelect: () => {
                navigate({ name: "tickets" });
                setCreateTicketOpen(true);
            }
        },
        {
            key: "action.theme-toggle",
            label: resolved === "dark" ? t("theme.light") : t("theme.dark"),
            group: t("command.group.actions"),
            icon: resolved === "dark" ? _jsx(IconSun, {}) : _jsx(IconMoon, {}),
            onSelect: () => setTheme(resolved === "dark" ? "light" : "dark")
        },
        {
            key: "action.logout",
            label: t("auth.logout"),
            group: t("command.group.actions"),
            icon: _jsx(IconLogOut, {}),
            onSelect: logout
        }
    ];
    return (_jsxs("div", { className: "app-shell", "data-sidebar": collapsed ? "collapsed" : "expanded", children: [_jsx(Sidebar, { collapsed: collapsed, onToggleCollapse: toggleCollapse, activeView: activeView, onNavigate: navigate }), _jsxs("div", { className: "main-area", children: [_jsx(Topbar, { onOpenCommand: () => setCommandOpen(true), onNavigate: navigate }), _jsxs("div", { className: "page-scroll", children: [view.name === "dashboard" && (_jsx(DashboardPage, { onOpenTicket: (id) => navigate({ name: "ticket-detail", id }), onNavigate: navigate, onCreateTicket: () => {
                                    navigate({ name: "tickets" });
                                    setCreateTicketOpen(true);
                                } })), view.name === "tickets" && (_jsx(TicketsPage, { onViewDetail: (id) => navigate({ name: "ticket-detail", id }), externalCreateOpen: createTicketOpen, onCreateOpenChange: setCreateTicketOpen })), view.name === "ticket-detail" && (_jsx(TicketDetailPage, { ticketId: view.id, onBack: () => navigate({ name: "tickets" }) })), view.name === "reports" && !isCustomer() && _jsx(ReportsPage, {}), view.name === "settings" && _jsx(SettingsPage, {})] })] }), _jsx(CommandPalette, { open: commandOpen, onClose: () => setCommandOpen(false), actions: commands, placeholder: t("command.placeholder"), emptyText: t("command.empty") })] }));
};
