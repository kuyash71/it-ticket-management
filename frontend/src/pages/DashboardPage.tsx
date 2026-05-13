import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBarChart,
  IconCheckCircle,
  IconClock,
  IconInbox,
  IconPlus
} from "../components/ui/Icon";
import { PriorityBadge, StatusBadge, TypeBadge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import type { SummaryReport, Ticket } from "../types/api";
import type { AppView } from "../App";
import { formatRelative } from "../lib/format";

type DashboardPageProps = {
  onOpenTicket: (id: string) => void;
  onNavigate: (view: AppView) => void;
  onCreateTicket: () => void;
};

export const DashboardPage = ({ onOpenTicket, onNavigate, onCreateTicket }: DashboardPageProps) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { isCustomer } = useRole();

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [tx, sm] = await Promise.all([
        http.get<Ticket[]>("/api/tickets"),
        isCustomer() ? Promise.resolve(null) : http.get<SummaryReport>("/api/reports/summary").then((r) => r.data)
      ]);
      setTickets(tx.data);
      setSummary(sm);
    } catch {
      setError(t("error.fetch_failed"));
    }
  }, [t, isCustomer]);

  useEffect(() => {
    if (!token) return;
    void fetchAll();
  }, [token, fetchAll]);

  const recent = useMemo(() => {
    if (!tickets) return [];
    return [...tickets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [tickets]);

  const openCount = useMemo(() => {
    if (summary) return summary.openTickets;
    if (!tickets) return null;
    return tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED").length;
  }, [summary, tickets]);

  return (
    <div className="page-container">
      <WelcomeBanner onCreate={onCreateTicket} />

      {error && <div style={{ marginBottom: "var(--space-4)" }}><ErrorBanner>{error}</ErrorBanner></div>}

      <div className="stats-grid">
        <StatCard
          label={t("dashboard.stat.open")}
          value={openCount}
          icon={<IconInbox />}
          loading={tickets === null}
        />
        {!isCustomer() && (
          <>
            <StatCard
              label={t("dashboard.stat.resolved")}
              value={summary?.resolvedTotal}
              icon={<IconCheckCircle />}
              loading={summary === null}
            />
            <StatCard
              label={t("dashboard.stat.sla_breaches")}
              value={summary?.slaBreachCount}
              icon={<IconAlertTriangle />}
              tone={summary && summary.slaBreachCount > 0 ? "danger" : undefined}
              loading={summary === null}
            />
            <StatCard
              label={t("dashboard.stat.avg_resolution")}
              value={summary ? `${summary.avgResolutionHours.toFixed(1)}h` : null}
              icon={<IconClock />}
              loading={summary === null}
            />
          </>
        )}
        {isCustomer() && tickets && (
          <StatCard
            label={t("dashboard.stat.total")}
            value={tickets.length}
            icon={<IconBarChart />}
          />
        )}
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t("dashboard.recent.title")}</div>
              <div className="card-subtitle">{t("dashboard.recent.subtitle")}</div>
            </div>
            <Button variant="ghost" size="sm" trailingIcon={<IconArrowRight />} onClick={() => onNavigate({ name: "tickets" })}>
              {t("dashboard.view_all")}
            </Button>
          </div>
          {tickets === null ? (
            <div style={{ padding: "var(--space-4)" }}>
              <Skeleton variant="title" />
              <div style={{ height: "var(--space-3)" }} />
              <Skeleton />
              <div style={{ height: "var(--space-2)" }} />
              <Skeleton />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<IconInbox size={20} />}
              title={t("ticket.empty")}
              description={t("ticket.empty.desc")}
              action={
                <Button variant="primary" leadingIcon={<IconPlus />} onClick={onCreateTicket}>
                  {t("ticket.create")}
                </Button>
              }
            />
          ) : (
            <div className="data-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("ticket.col.title")}</th>
                    <th>{t("ticket.col.status")}</th>
                    {!isCustomer() && <th>{t("ticket.col.priority")}</th>}
                    <th>{t("dashboard.updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tk) => (
                    <tr key={tk.id} tabIndex={0} onClick={() => onOpenTicket(tk.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") onOpenTicket(tk.id); }}>
                      <td className="col-title">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <TypeBadge type={tk.type} />
                          <span>{tk.title}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={tk.status} /></td>
                      {!isCustomer() && <td><PriorityBadge priority={tk.priority} /></td>}
                      <td className="text-muted text-xs">{formatRelative(tk.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="card card--padded">
            <div className="section-header" style={{ marginBottom: "var(--space-3)" }}>
              <div className="section-title">{t("dashboard.quick.title")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Button variant="default" block leadingIcon={<IconPlus />} onClick={onCreateTicket}>
                {t("ticket.create")}
              </Button>
              <Button variant="ghost" block leadingIcon={<IconInbox />} onClick={() => onNavigate({ name: "tickets" })}>
                {t("dashboard.quick.all_tickets")}
              </Button>
              {!isCustomer() && (
                <Button variant="ghost" block leadingIcon={<IconBarChart />} onClick={() => onNavigate({ name: "reports" })}>
                  {t("dashboard.quick.reports")}
                </Button>
              )}
            </div>
          </div>

          {summary && !isCustomer() && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">{t("dashboard.status_breakdown")}</div>
              </div>
              <div className="card-body">
                <div className="distribution">
                  {Object.entries(summary.byStatus).map(([status, count]) => {
                    const total = summary.totalTickets || 1;
                    const pct = (count / total) * 100;
                    return (
                      <div key={status} className="distribution-row" style={{ gridTemplateColumns: "1fr 80px 30px" }}>
                        <div className="distribution-label">
                          <StatusBadge status={status as Ticket["status"]} />
                        </div>
                        <div className="distribution-track">
                          <div className="distribution-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="distribution-value">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const WelcomeBanner = ({ onCreate }: { onCreate: () => void }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const hour = new Date().getHours();
  const greetKey =
    hour < 6 ? "dashboard.greet.night" :
    hour < 12 ? "dashboard.greet.morning" :
    hour < 18 ? "dashboard.greet.afternoon" :
    "dashboard.greet.evening";

  const userName = (() => {
    if (!token) return "";
    try {
      const p = JSON.parse(atob(token.split(".")[1] ?? ""));
      return p.given_name ?? p.name ?? p.preferred_username ?? "";
    } catch { return ""; }
  })();

  return (
    <div className="welcome-banner">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <h1 className="welcome-title">
            {t(greetKey)}{userName ? `, ${userName}` : ""}
          </h1>
          <p className="welcome-subtitle">{t("dashboard.welcome.subtitle")}</p>
        </div>
        <Button variant="primary" leadingIcon={<IconPlus />} onClick={onCreate}>
          {t("ticket.create")}
        </Button>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  tone,
  loading
}: {
  label: string;
  value: number | string | null | undefined;
  icon: JSX.Element;
  tone?: "danger";
  loading?: boolean;
}) => (
  <div className="stat-card">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div className="stat-card-label">{label}</div>
      <span style={{ color: tone === "danger" ? "var(--color-danger)" : "var(--text-muted)" }}>
        {icon}
      </span>
    </div>
    <div className="stat-card-value" style={tone === "danger" ? { color: "var(--color-danger)" } : undefined}>
      {loading ? <Skeleton variant="title" width={60} /> : (value ?? 0)}
    </div>
  </div>
);
