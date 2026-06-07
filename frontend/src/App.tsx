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

export type AppView =
  | { name: "dashboard" }
  | { name: "tickets"; overtime?: boolean }
  | { name: "ticket-detail"; id: string }
  | { name: "reports" }
  | { name: "settings" };

const TITLES: Record<string, { title: string; crumb: string }> = {
  dashboard: { title: "Genel Bakış", crumb: "Hoş geldiniz" },
  tickets: { title: "Talepler", crumb: "Tüm talepler" },
  reports: { title: "Raporlar", crumb: "Tüm metrikler" },
  settings: { title: "Ayarlar", crumb: "Kişisel tercihler" },
};

export const App = () => {
  const { initialized, token, roles } = useAuth();
  const [view, setView] = useState<AppView>({ name: "dashboard" });
  const [createTicketOpen, setCreateTicketOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("itsm");
    if (!document.body.getAttribute("data-theme")) {
      document.body.setAttribute("data-theme", "light");
    }
  }, []);

  if (!initialized) {
    return (
      <div className="itsm" data-theme="light" style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <div className="col" style={{ alignItems: "center", gap: 12 }}>
          <Icon name="spin" size={32} />
          <span className="faint">Yükleniyor…</span>
        </div>
      </div>
    );
  }

  const role: "MANAGER" | "AGENT" | "CUSTOMER" = roles.includes("MANAGER")
    ? "MANAGER"
    : roles.includes("AGENT")
    ? "AGENT"
    : "CUSTOMER";

  const roleLabel = role === "MANAGER" ? "Yönetici" : role === "AGENT" ? "Uzman" : "Müşteri";

  const userName = (() => {
    if (!token) return "Kullanıcı";
    try {
      const p = parseJwtPayload(token);
      return (p.name as string) ?? (p.preferred_username as string) ?? "Kullanıcı";
    } catch { return "Kullanıcı"; }
  })();

  const activeId =
    view.name === "ticket-detail" ? "tickets"
    : view.name === "tickets" && view.overtime ? "overtime"
    : view.name;
  const meta = TITLES[activeId] ?? TITLES.dashboard;
  const navigate = (next: AppView) => setView(next);
  const isCustomer = role === "CUSTOMER";

  const topActions = (
    <>
      {!isCustomer && view.name !== "settings" && (
        <button className="btn" onClick={() => { navigate({ name: "tickets" }); setCreateTicketOpen(true); }}>
          <Icon name="plus" size={13} />Yeni Talep
        </button>
      )}
      {isCustomer && view.name === "tickets" && (
        <button className="btn btn-primary" onClick={() => setCreateTicketOpen(true)}>
          <Icon name="plus" size={13} />Yeni Talep
        </button>
      )}
    </>
  );

  return (
    <div className="app" style={{ height: "100vh" }}>
      <Sidebar
        role={role}
        userName={userName}
        userRoleLabel={roleLabel}
        active={activeId}
        navigate={navigate}
      />
      <div className="main">
        <Topbar title={meta.title} crumb={meta.crumb} showSearch={!isCustomer} actions={topActions} />
        <div className="content">
          {view.name === "dashboard" && (
            <DashboardPage
              onOpenTicket={(id) => navigate({ name: "ticket-detail", id })}
              onNavigate={navigate}
              onCreateTicket={() => { navigate({ name: "tickets" }); setCreateTicketOpen(true); }}
            />
          )}
          {view.name === "tickets" && (
            <TicketsPage
              key={view.overtime ? "tickets-overtime" : "tickets-all"}
              initialOvertime={!!view.overtime}
              onViewDetail={(id) => navigate({ name: "ticket-detail", id })}
              externalCreateOpen={createTicketOpen}
              onCreateOpenChange={setCreateTicketOpen}
            />
          )}
          {view.name === "ticket-detail" && (
            <TicketDetailPage ticketId={view.id} onBack={() => navigate({ name: "tickets" })} />
          )}
          {view.name === "reports" && !isCustomer && <ReportsPage />}
          {view.name === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
};
