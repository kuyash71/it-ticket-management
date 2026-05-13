import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { http } from "../api/http";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import {
  IconAlertTriangle,
  IconBarChart,
  IconCheckCircle,
  IconClock,
  IconInbox,
  IconRefresh,
  IconTrend
} from "../components/ui/Icon";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge, TypeBadge } from "../components/ui/Badge";
import type { SummaryReport, TicketStatus, TicketType } from "../types/api";

export const ReportsPage = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setError(null);
    try {
      const res = await http.get<SummaryReport>("/api/reports/summary");
      setReport(res.data);
    } catch {
      setError(t("error.fetch_failed"));
    }
  }, [t]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("report.title")}</h1>
          <p className="page-subtitle">{t("report.subtitle")}</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" size="sm" leadingIcon={<IconRefresh />} onClick={() => void fetchReport()}>
            {t("action.refresh")}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      <div className="stats-grid">
        <ReportStat
          label={t("report.open_tickets")}
          value={report?.openTickets}
          icon={<IconInbox />}
          loading={report === null}
        />
        <ReportStat
          label={t("report.total_tickets")}
          value={report?.totalTickets}
          icon={<IconBarChart />}
          loading={report === null}
        />
        <ReportStat
          label={t("report.resolved_total")}
          value={report?.resolvedTotal}
          icon={<IconCheckCircle />}
          loading={report === null}
        />
        <ReportStat
          label={t("report.sla_breach_count")}
          value={report?.slaBreachCount}
          icon={<IconAlertTriangle />}
          tone={report && report.slaBreachCount > 0 ? "danger" : undefined}
          loading={report === null}
        />
        <ReportStat
          label={t("report.sla_breach_rate")}
          value={report ? `${report.slaBreachRatePercent.toFixed(1)}%` : null}
          icon={<IconTrend />}
          tone={report && report.slaBreachRatePercent > 20 ? "danger" : undefined}
          loading={report === null}
        />
        <ReportStat
          label={t("report.avg_resolution_hours")}
          value={report ? `${report.avgResolutionHours.toFixed(1)}h` : null}
          icon={<IconClock />}
          loading={report === null}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t("report.by_status")}</div>
              <div className="card-subtitle">{t("report.by_status.subtitle")}</div>
            </div>
          </div>
          <div className="card-body">
            {report === null ? (
              <DistributionSkeleton />
            ) : (
              <StatusDistribution data={report.byStatus} total={report.totalTickets} />
            )}
          </div>
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <section className="card">
            <div className="card-header">
              <div className="card-title">{t("report.by_type")}</div>
            </div>
            <div className="card-body">
              {report === null ? (
                <DistributionSkeleton rows={2} />
              ) : (
                <TypeDistribution data={report.byType} total={report.totalTickets} />
              )}
            </div>
          </section>

          {report && (
            <section className="card">
              <div className="card-header">
                <div className="card-title">{t("report.sla_overview")}</div>
              </div>
              <div className="card-body">
                <SLAOverview report={report} />
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

const ReportStat = ({
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
    <div
      className="stat-card-value"
      style={tone === "danger" ? { color: "var(--color-danger)" } : undefined}
    >
      {loading ? <Skeleton variant="title" width={60} /> : (value ?? 0)}
    </div>
  </div>
);

const StatusDistribution = ({ data, total }: { data: Record<string, number>; total: number }) => {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const safeTotal = total || 1;
  return (
    <div className="distribution">
      {entries.map(([status, count]) => {
        const pct = (count / safeTotal) * 100;
        return (
          <div key={status} className="distribution-row">
            <div className="distribution-label">
              <StatusBadge status={status as TicketStatus} />
            </div>
            <div className="distribution-track">
              <div className="distribution-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="distribution-value">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

const TypeDistribution = ({ data, total }: { data: Record<string, number>; total: number }) => {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const safeTotal = total || 1;
  return (
    <div className="distribution">
      {entries.map(([type, count]) => {
        const pct = (count / safeTotal) * 100;
        return (
          <div key={type} className="distribution-row">
            <div className="distribution-label">
              <TypeBadge type={type as TicketType} />
            </div>
            <div className="distribution-track">
              <div className="distribution-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="distribution-value">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

const SLAOverview = ({ report }: { report: SummaryReport }) => {
  const { t } = useTranslation();
  const total = report.totalTickets || 1;
  const breachPct = report.slaBreachRatePercent;
  const resolvedPct = (report.resolvedTotal / total) * 100;

  const breachClass =
    breachPct >= 50 ? "distribution-fill--danger" :
    breachPct >= 20 ? "distribution-fill--warning" :
    "distribution-fill--success";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <SLABar
        label={t("report.sla_breach_rate")}
        valueLabel={`${breachPct.toFixed(1)}%`}
        pct={Math.min(breachPct, 100)}
        fillClass={breachClass}
        caption={t("report.sla_breach_caption", { count: report.slaBreachCount, total })}
      />
      <SLABar
        label={t("report.resolution_rate")}
        valueLabel={`${resolvedPct.toFixed(0)}%`}
        pct={resolvedPct}
        fillClass="distribution-fill--success"
        caption={t("report.resolved_caption", { count: report.resolvedTotal, total })}
      />
    </div>
  );
};

const SLABar = ({
  label,
  valueLabel,
  pct,
  fillClass,
  caption
}: {
  label: string;
  valueLabel: string;
  pct: number;
  fillClass: string;
  caption: string;
}) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{label}</span>
      <span style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{valueLabel}</span>
    </div>
    <div className="distribution-track">
      <div className={`distribution-fill ${fillClass}`} style={{ width: `${pct}%` }} />
    </div>
    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>{caption}</div>
  </div>
);

const DistributionSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="distribution">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="distribution-row">
        <Skeleton width={100} />
        <Skeleton />
        <Skeleton width={30} />
      </div>
    ))}
  </div>
);
