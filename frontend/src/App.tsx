import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "./auth/AuthProvider";
import { useRole } from "./auth/useRole";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { CommandPalette } from "./components/ui/CommandPalette";
import type { CommandAction } from "./components/ui/CommandPalette";
import {
  IconBarChart,
  IconInbox,
  IconLayoutDashboard,
  IconLogOut,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun
} from "./components/ui/Icon";
import { LoadingState } from "./components/ui/Spinner";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketsPage } from "./pages/TicketsPage";
import { useTheme } from "./theme/ThemeProvider";
import "./styles/globals.css";

export type AppView =
  | { name: "dashboard" }
  | { name: "tickets" }
  | { name: "ticket-detail"; id: string }
  | { name: "reports" }
  | { name: "settings" };

const SIDEBAR_KEY = "itsm.sidebar.collapsed";

export const App = () => {
  const { t } = useTranslation();
  const { initialized, logout } = useAuth();
  const { isCustomer } = useRole();
  const { resolved, setTheme } = useTheme();

  const [view, setView] = useState<AppView>({ name: "dashboard" });
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(SIDEBAR_KEY) === "1");
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
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!initialized) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
        <LoadingState text={t("app.loading")} />
      </div>
    );
  }

  const activeView = view.name === "ticket-detail" ? "tickets" : view.name;

  const navigate = (next: AppView) => setView(next);

  const commands: CommandAction[] = [
    {
      key: "nav.dashboard",
      label: t("nav.dashboard"),
      group: t("command.group.navigate"),
      icon: <IconLayoutDashboard />,
      onSelect: () => navigate({ name: "dashboard" })
    },
    {
      key: "nav.tickets",
      label: t("nav.tickets"),
      group: t("command.group.navigate"),
      icon: <IconInbox />,
      onSelect: () => navigate({ name: "tickets" })
    },
    ...(isCustomer()
      ? []
      : [
          {
            key: "nav.reports",
            label: t("nav.reports"),
            group: t("command.group.navigate"),
            icon: <IconBarChart />,
            onSelect: () => navigate({ name: "reports" })
          }
        ]),
    {
      key: "nav.settings",
      label: t("nav.settings"),
      group: t("command.group.navigate"),
      icon: <IconSettings />,
      onSelect: () => navigate({ name: "settings" })
    },
    {
      key: "action.create-ticket",
      label: t("ticket.create"),
      group: t("command.group.actions"),
      icon: <IconPlus />,
      onSelect: () => {
        navigate({ name: "tickets" });
        setCreateTicketOpen(true);
      }
    },
    {
      key: "action.theme-toggle",
      label: resolved === "dark" ? t("theme.light") : t("theme.dark"),
      group: t("command.group.actions"),
      icon: resolved === "dark" ? <IconSun /> : <IconMoon />,
      onSelect: () => setTheme(resolved === "dark" ? "light" : "dark")
    },
    {
      key: "action.logout",
      label: t("auth.logout"),
      group: t("command.group.actions"),
      icon: <IconLogOut />,
      onSelect: logout
    }
  ];

  return (
    <div className="app-shell" data-sidebar={collapsed ? "collapsed" : "expanded"}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        activeView={activeView}
        onNavigate={navigate}
      />

      <div className="main-area">
        <Topbar onOpenCommand={() => setCommandOpen(true)} onNavigate={navigate} />

        <div className="page-scroll">
          {view.name === "dashboard" && (
            <DashboardPage
              onOpenTicket={(id) => navigate({ name: "ticket-detail", id })}
              onNavigate={navigate}
              onCreateTicket={() => {
                navigate({ name: "tickets" });
                setCreateTicketOpen(true);
              }}
            />
          )}
          {view.name === "tickets" && (
            <TicketsPage
              onViewDetail={(id) => navigate({ name: "ticket-detail", id })}
              externalCreateOpen={createTicketOpen}
              onCreateOpenChange={setCreateTicketOpen}
            />
          )}
          {view.name === "ticket-detail" && (
            <TicketDetailPage
              ticketId={view.id}
              onBack={() => navigate({ name: "tickets" })}
            />
          )}
          {view.name === "reports" && !isCustomer() && <ReportsPage />}
          {view.name === "settings" && <SettingsPage />}
        </div>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        actions={commands}
        placeholder={t("command.placeholder")}
        emptyText={t("command.empty")}
      />
    </div>
  );
};
