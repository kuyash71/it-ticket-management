import { useCallback, useEffect, useState } from "react";

import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import { Card, ErrorBanner, SkChart, SkKPI, SkRows } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, KPI, PriorityPill, SLABar, StatusBadge, Stars } from "../components/itsm/Primitives";
import { AreaChart, Donut, Gauge, HBar, RatingDist, StackedBar } from "../components/itsm/Charts";
import { STATUS_HEX, STATUS_META } from "../components/itsm/meta";
import { formatActor, formatRelative } from "../lib/format";
import type { SummaryReport, Ticket, TicketStatus } from "../types/api";

type FeedbackReport = {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  perAgent: { agentId: string; count: number; averageRating: number }[];
};

type AgentWorkloadReport = {
  agents: { agentId: string; total: number; byStatus: Record<string, number> }[];
};

type Section = "summary" | "feedback" | "workload" | "overtime";

export const ReportsPage = () => {
  const { isManager } = useRole();
  const [section, setSection] = useState<Section>("summary");
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [workload, setWorkload] = useState<AgentWorkloadReport | null>(null);
  const [overtime, setOvertime] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const s = await http.get<SummaryReport>("/api/v1/reports/summary");
      setSummary(s.data);
      if (isManager()) {
        try { setFeedback((await http.get<FeedbackReport>("/api/v1/reports/feedback")).data); } catch {/* */}
        try { setWorkload((await http.get<AgentWorkloadReport>("/api/v1/reports/agents/workload")).data); } catch {/* */}
        try { setOvertime((await http.get<Ticket[]>("/api/v1/tickets/overtime")).data); } catch {/* */}
      }
    } catch { setError("Raporlar yüklenemedi."); }
  }, [isManager]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const tabs: { id: Section; label: string }[] = [
    { id: "summary", label: "Özet" },
    ...(isManager() ? [
      { id: "feedback" as Section, label: "Geri Bildirim" },
      { id: "workload" as Section, label: "Uzman Yükü" },
      { id: "overtime" as Section, label: "Süre Aşımı" }
    ] : [])
  ];

  return (
    <div className="col gap-4">
      {error && <ErrorBanner msg={error} onRetry={() => void fetchAll()} />}
      <div className="tabs">
        {tabs.map((t) => (
          <div key={t.id} className={"tab " + (section === t.id ? "active" : "")} onClick={() => setSection(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {section === "summary" && <SummarySection summary={summary} />}
      {section === "feedback" && <FeedbackSection feedback={feedback} />}
      {section === "workload" && <WorkloadSection workload={workload} />}
      {section === "overtime" && <OvertimeSection overtime={overtime} />}
    </div>
  );
};

function SummarySection({ summary }: { summary: SummaryReport | null }) {
  const loading = summary === null;
  const statusData = summary
    ? Object.entries(summary.byStatus).map(([k, v]) => ({
        label: STATUS_META[k as TicketStatus]?.label ?? k,
        value: v,
        color: STATUS_HEX[k as TicketStatus] ?? "#888"
      }))
    : [];
  const typeData = summary
    ? [
        { label: "Olay", value: summary.byType.INCIDENT ?? 0, color: "#d32f33" },
        { label: "Hizmet", value: summary.byType.SERVICE_REQUEST ?? 0, color: "#2563eb" }
      ]
    : [];
  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 14 }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => <SkKPI key={i} />) : summary && (
          <>
            <KPI label="Açık" value={summary.openTickets} tone="blue" icon="inbox" />
            <KPI label="Toplam" value={summary.totalTickets} tone="gray" icon="ticket" />
            <KPI label="Çözülen" value={summary.resolvedTotal} tone="green" icon="check" />
            <KPI label="SLA İhlal" value={summary.slaBreachCount} tone="red" icon="alert" alert />
            <KPI label="İhlal Oranı" value={summary.slaBreachRatePercent.toFixed(1)} unit="%" tone="orange" icon="shield" />
            <KPI label="Ort. Çözüm" value={summary.avgResolutionHours.toFixed(1)} unit="sa" tone="teal" icon="clock" />
          </>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "start" }}>
        <Card title="Durum Dağılımı">
          {loading ? <SkChart h={180} /> : <HBar data={statusData} width={320} />}
        </Card>
        <Card title="Tür Dağılımı">
          {loading ? <SkChart h={180} /> : (
            <div className="col gap-3" style={{ alignItems: "center" }}>
              <Donut data={typeData} size={150} thickness={26} centerLabel={summary?.totalTickets ?? 0} centerSub="toplam" />
              <div className="legend">
                {typeData.map((d) => (
                  <span key={d.label} className="legend-item">
                    <span className="sw" style={{ background: d.color }} />{d.label}<b>{d.value}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card title="SLA Uyum Oranı" head={<span className="faint" style={{ fontSize: "var(--fs-cap)" }}>Hedef ≥%95</span>}>
          {loading ? <SkChart h={180} /> : summary && (
            <div className="col gap-2" style={{ alignItems: "center" }}>
              <Gauge value={100 - summary.slaBreachRatePercent} label={`%${(100 - summary.slaBreachRatePercent).toFixed(1)}`} sub="uyum" color="#11874a" />
              <div className="row" style={{ gap: 18, fontSize: "var(--fs-cap)" }}>
                <span className="row" style={{ gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#11874a" }} />
                  <b className="tnum">{summary.resolvedTotal - summary.slaBreachCount}</b>
                  <span className="faint">uyumlu</span>
                </span>
                <span className="row" style={{ gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#d32f33" }} />
                  <b className="tnum" style={{ color: "var(--red)" }}>{summary.slaBreachCount}</b>
                  <span className="faint">ihlal</span>
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function FeedbackSection({ feedback }: { feedback: FeedbackReport | null }) {
  const loading = feedback === null;
  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
        <Card title="Ortalama Puan">
          {loading ? <SkChart h={140} /> : feedback && (
            <div className="col" style={{ gap: 6 }}>
              <div className="big-num tnum" style={{ fontSize: 56, color: "var(--amber)" }}>{feedback.averageRating.toFixed(1)}</div>
              <Stars value={feedback.averageRating} size={18} />
              <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>{feedback.totalFeedback} değerlendirme üzerinden</span>
            </div>
          )}
        </Card>
        <Card title="Puan Dağılımı">
          {loading ? <SkChart h={140} /> : feedback && (
            <RatingDist
              dist={Object.fromEntries(Object.entries(feedback.ratingDistribution).map(([k, v]) => [Number(k), Number(v)]))}
              total={feedback.totalFeedback}
              width={300}
            />
          )}
        </Card>
        <Card title="Toplam Geri Bildirim">
          {loading ? <SkChart h={140} /> : feedback && (
            <div className="col gap-3">
              <div className="big-num tnum">{feedback.totalFeedback}</div>
              <div className="faint" style={{ fontSize: "var(--fs-sm)" }}>kapanan talepler üzerinden alınan</div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Uzman Bazında Geri Bildirim" pad={false}>
        {loading ? <SkRows n={4} /> : feedback && feedback.perAgent.length === 0 ? (
          <p className="faint" style={{ padding: 16, fontSize: "var(--fs-sm)" }}>Henüz veri yok.</p>
        ) : feedback && (
          <table className="tbl">
            <thead><tr><th>Uzman</th><th>Talep Sayısı</th><th>Ortalama</th><th style={{ width: 200 }}>Puan</th></tr></thead>
            <tbody>
              {feedback.perAgent.map((a) => (
                <tr key={a.agentId}>
                  <td><Assignee id={a.agentId} name={formatActor(a.agentId)} /></td>
                  <td className="tnum">{a.count}</td>
                  <td><span className="tnum" style={{ fontWeight: 600 }}>{a.averageRating.toFixed(1)}</span></td>
                  <td><Stars value={a.averageRating} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function WorkloadSection({ workload }: { workload: AgentWorkloadReport | null }) {
  const loading = workload === null;
  const cats = workload ? workload.agents.map((a) => ({
    label: formatActor(a.agentId).slice(0, 12),
    total: a.total,
    values: a.byStatus
  })) : [];
  const keys = [
    { id: "NEW", label: "Yeni", color: STATUS_HEX.NEW },
    { id: "IN_PROGRESS", label: "İşlemde", color: STATUS_HEX.IN_PROGRESS },
    { id: "WAITING_FOR_CUSTOMER", label: "Müşteri", color: STATUS_HEX.WAITING_FOR_CUSTOMER },
    { id: "RESOLVED", label: "Çözüldü", color: STATUS_HEX.RESOLVED }
  ];
  const sorted = workload ? [...workload.agents].sort((a, b) => b.total - a.total) : [];
  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Card title="En Yüklü">
          {loading || !sorted.length ? <SkChart h={80} /> : (
            <div className="row" style={{ gap: 10 }}>
              <Assignee id={sorted[0].agentId} name={formatActor(sorted[0].agentId)} sub role="Uzman" />
              <span className="badge tone-red" style={{ marginLeft: "auto" }}>{sorted[0].total}</span>
            </div>
          )}
        </Card>
        <Card title="En Az Yüklü">
          {loading || !sorted.length ? <SkChart h={80} /> : (
            <div className="row" style={{ gap: 10 }}>
              <Assignee id={sorted[sorted.length - 1].agentId} name={formatActor(sorted[sorted.length - 1].agentId)} sub role="Uzman" />
              <span className="badge tone-green" style={{ marginLeft: "auto" }}>{sorted[sorted.length - 1].total}</span>
            </div>
          )}
        </Card>
        <Card title="Ortalama">
          {loading ? <SkChart h={80} /> : workload && (
            <div className="row" style={{ gap: 12 }}>
              <div className="kpi-ic" style={{ width: 36, height: 36, ["--tone" as any]: "var(--teal)" } as any}>
                <Icon name="users" size={18} />
              </div>
              <div className="col">
                <div className="big-num tnum">{workload.agents.length ? (workload.agents.reduce((s, a) => s + a.total, 0) / workload.agents.length).toFixed(1) : "0"}</div>
                <div className="faint" style={{ fontSize: "var(--fs-cap)" }}>uzman başına aktif</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Uzman Yükü" head={<span className="faint" style={{ fontSize: "var(--fs-cap)" }}>Durum bazında</span>}>
        {loading ? <SkChart h={220} /> : cats.length === 0 ? (
          <p className="faint" style={{ fontSize: "var(--fs-sm)" }}>Veri yok.</p>
        ) : (
          <div className="col gap-3">
            <StackedBar categories={cats} keys={keys} width={1000} height={220} />
            <div className="legend">
              {keys.map((k) => (
                <span key={k.id} className="legend-item">
                  <span className="sw" style={{ background: k.color }} />{k.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Uzman Detay" pad={false}>
        {loading ? <SkRows n={4} /> : workload && workload.agents.length === 0 ? (
          <p className="faint" style={{ padding: 16, fontSize: "var(--fs-sm)" }}>Henüz veri yok.</p>
        ) : workload && (
          <table className="tbl">
            <thead>
              <tr><th>Uzman</th><th>Toplam</th><th>Yeni</th><th>İşlemde</th><th>Müşteri Bekliyor</th><th>Çözüldü</th></tr>
            </thead>
            <tbody>
              {workload.agents.map((a) => (
                <tr key={a.agentId}>
                  <td><Assignee id={a.agentId} name={formatActor(a.agentId)} sub role="Uzman" /></td>
                  <td><b className="tnum">{a.total}</b></td>
                  <td className="tnum">{a.byStatus.NEW || 0}</td>
                  <td className="tnum"><span style={{ color: STATUS_HEX.IN_PROGRESS, fontWeight: 600 }}>{a.byStatus.IN_PROGRESS || 0}</span></td>
                  <td className="tnum">{a.byStatus.WAITING_FOR_CUSTOMER || 0}</td>
                  <td className="tnum">{a.byStatus.RESOLVED || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function OvertimeSection({ overtime }: { overtime: Ticket[] | null }) {
  const loading = overtime === null;
  const breach = overtime?.filter((t) => t.sla?.level === "BREACH") ?? [];
  const risk = overtime?.filter((t) => t.sla?.level === "RISK") ?? [];
  const warn = overtime?.filter((t) => t.sla?.level === "WARNING") ?? [];
  return (
    <div className="col gap-4">
      {overtime && overtime.length > 0 && (
        <ErrorBanner msg={`${overtime.length} talep süre aşımında veya risk altında.`} />
      )}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <KPI label="Süre Aşımı" value={breach.length} tone="red" icon="alert" alert={breach.length > 0} foot="aktif" />
        <KPI label="Risk (>85%)" value={risk.length} tone="orange" icon="clock" foot="müdahale gerekli" />
        <KPI label="Uyarı (>70%)" value={warn.length} tone="amber" icon="info" foot="izlemede" />
      </div>
      <Card title="Süre Aşımındaki Talepler" pad={false}>
        {loading ? <SkRows n={4} /> : !overtime?.length ? (
          <p className="faint" style={{ padding: 16, fontSize: "var(--fs-sm)" }}>Şu anda risk altındaki talep yok.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Başlık</th><th>Uzman</th><th>Öncelik</th><th style={{ width: 170 }}>SLA</th><th>Durum</th></tr>
            </thead>
            <tbody>
              {overtime.map((t) => (
                <tr key={t.id}>
                  <td className="col-id">#{t.id.slice(0, 8)}</td>
                  <td className="ttl" style={{ maxWidth: 360 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td>{t.assigneeId ? <Assignee id={t.assigneeId} name={formatActor(t.assigneeId)} /> : <span className="faint">—</span>}</td>
                  <td><PriorityPill priority={t.priority} /></td>
                  <td>{t.sla && <SLABar sla={t.sla} />}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
