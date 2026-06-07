import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { Sidebar, Topbar } from "./components/itsm/Shell";
import { Icon } from "./components/itsm/Icon";
import { parseJwtPayload } from "./lib/jwt";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketsPage } from "./pages/TicketsPage";
const TITLES = {
    dashboard: { title: "Genel Bakış", crumb: "Hoş geldiniz" },
    tickets: { title: "Talepler", crumb: "Tüm talepler" },
    reports: { title: "Raporlar", crumb: "Tüm metrikler" },
    settings: { title: "Ayarlar", crumb: "Kişisel tercihler" },
};
export const App = () => {
    const { initialized, token, roles } = useAuth();
    const [view, setView] = useState({ name: "dashboard" });
    const [createTicketOpen, setCreateTicketOpen] = useState(false);
    useEffect(() => {
        document.body.classList.add("itsm");
        if (!document.body.getAttribute("data-theme")) {
            document.body.setAttribute("data-theme", "light");
        }
    }, []);
    if (!initialized) {
        return (_jsx("div", { className: "itsm", "data-theme": "light", style: { height: "100vh", display: "grid", placeItems: "center" }, children: _jsxs("div", { className: "col", style: { alignItems: "center", gap: 12 }, children: [_jsx(Icon, { name: "spin", size: 32 }), _jsx("span", { className: "faint", children: "Y\u00FCkleniyor\u2026" })] }) }));
    }
    const role = roles.includes("MANAGER")
        ? "MANAGER"
        : roles.includes("AGENT")
            ? "AGENT"
            : "CUSTOMER";
    const roleLabel = role === "MANAGER" ? "Yönetici" : role === "AGENT" ? "Uzman" : "Müşteri";
    const userName = (() => {
        if (!token)
            return "Kullanıcı";
        try {
            const p = parseJwtPayload(token);
            return p.name ?? p.preferred_username ?? "Kullanıcı";
        }
        catch {
            return "Kullanıcı";
        }
    })();
    const activeId = view.name === "ticket-detail" ? "tickets"
        : view.name === "tickets" && view.overtime ? "overtime"
            : view.name;
    const meta = TITLES[activeId] ?? TITLES.dashboard;
    const navigate = (next) => setView(next);
    const isCustomer = role === "CUSTOMER";
    const topActions = (_jsxs(_Fragment, { children: [!isCustomer && view.name !== "settings" && (_jsxs("button", { className: "btn", onClick: () => { navigate({ name: "tickets" }); setCreateTicketOpen(true); }, children: [_jsx(Icon, { name: "plus", size: 13 }), "Yeni Talep"] })), isCustomer && view.name === "tickets" && (_jsxs("button", { className: "btn btn-primary", onClick: () => setCreateTicketOpen(true), children: [_jsx(Icon, { name: "plus", size: 13 }), "Yeni Talep"] }))] }));
    return (_jsxs("div", { className: "app", style: { height: "100vh" }, children: [_jsx(Sidebar, { role: role, userName: userName, userRoleLabel: roleLabel, active: activeId, navigate: navigate }), _jsxs("div", { className: "main", children: [_jsx(Topbar, { title: meta.title, crumb: meta.crumb, showSearch: !isCustomer, actions: topActions }), _jsxs("div", { className: "content", children: [view.name === "dashboard" && (_jsx(DashboardPage, { onOpenTicket: (id) => navigate({ name: "ticket-detail", id }), onNavigate: navigate, onCreateTicket: () => { navigate({ name: "tickets" }); setCreateTicketOpen(true); } })), view.name === "tickets" && (_jsx(TicketsPage, { initialOvertime: !!view.overtime, onViewDetail: (id) => navigate({ name: "ticket-detail", id }), externalCreateOpen: createTicketOpen, onCreateOpenChange: setCreateTicketOpen }, view.overtime ? "tickets-overtime" : "tickets-all")), view.name === "ticket-detail" && (_jsx(TicketDetailPage, { ticketId: view.id, onBack: () => navigate({ name: "tickets" }) })), view.name === "reports" && !isCustomer && _jsx(ReportsPage, {}), view.name === "settings" && _jsx(SettingsPage, {})] })] })] }));
};
