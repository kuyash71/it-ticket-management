import { useCallback, useEffect, useMemo, useState } from "react";

import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { parseJwtPayload } from "../lib/jwt";
import { formatActor, formatRelative } from "../lib/format";
import { Card, EmptyState, ErrorBanner, SkChart, SkKPI, SkRows, WarnBanner } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, KPI, PriorityPill, SLABar, StatusBadge, Stars, TypeBadge } from "../components/itsm/Primitives";
import { Donut, LineChart } from "../components/itsm/Charts";
import { STATUS_HEX, STATUS_META } from "../components/itsm/meta";
import type { AppView } from "../App";
import type { SummaryReport, Ticket, TicketStatus } from "../types/api";

type Props = {
  onOpenTicket: (id: string) => void;
  onNavigate: (view: AppView) => void;
  onCreateTicket: () => void;
};

type FeedbackReport = {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  perAgent: { agentId: string; count: number; averageRating: number }[];
};

const OPEN_STATUSES: TicketStatus[] = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"];

export const DashboardPage = ({ onOpenTicket, onNavigate, onCreateTicket }: Props) => {
  const { token } = useAuth();
  const { isCustomer, isAgent, isManager } = useRole();

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [overtime, setOvertime] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role: "MANAGER" | "AGENT" | "CUSTOMER" = isManager() ? "MANAGER" : isAgent() ? "AGENT" : "CUSTOMER";

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const tx = await http.get<Ticket[]>("/api/v1/tickets");
      setTickets(tx.data);
      if (role !== "CUSTOMER") {
        const sm = await http.get<SummaryReport>("/api/v1/reports/summary");
        setSummary(sm.data);
      }
      if (role === "MANAGER") {
        try {
          const [fb, ot] = await Promise.all([
            http.get<FeedbackReport>("/api/v1/reports/feedback"),
            http.get<Ticket[]>("/api/v1/tickets/overtime")
          ]);
          setFeedback(fb.data);
          setOvertime(ot.data);
        } catch {
          /* optional */
        }
      }
    } catch {
      setError("Veriler yüklenemedi.");
    }
  }, [role]);

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

  if (error) {
    return <ErrorBanner msg={error} onRetry={() => void fetchAll()} />;
  }

  if (role === "MANAGER") {
    return (
      <ManagerDashboard
        tickets={tickets}
        summary={summary}
        feedback={feedback}
        overtime={overtime}
        recent={recent}
        onOpenTicket={onOpenTicket}
        onNavigate={onNavigate}
      />
    );
  }
  if (role === "AGENT") {
    return (
      <AgentDashboard
        tickets={tickets}
        summary={summary}
        onOpenTicket={onOpenTicket}
        onNavigate={onNavigate}
      />
    );
  }
  return <CustomerDashboard tickets={tickets} recent={recent} onOpenTicket={onOpenTicket} onCreateTicket={onCreateTicket} onNavigate={onNavigate} />;
};

function ManagerDashboard({
  tickets, summary, feedback, overtime, recent, onOpenTicket, onNavigate
}: {
  tickets: Ticket[] | null;
  summary: SummaryReport | null;
  feedback: FeedbackReport | null;
  overtime: Ticket[] | null;
  recent: Ticket[];
  onOpenTicket: (id: string) => void;
  onNavigate: (v: AppView) => void;
}) {
  const loadingSummary = summary === null;
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
        { label: "Hizmet Talebi", value: summary.byType.SERVICE_REQUEST ?? 0, color: "#2563eb" }
      ]
    : [];
  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 14 }}>
        {loadingSummary ? Array.from({ length: 6 }).map((_, i) => <SkKPI key={i} />) : summary && (
          <>
            <KPI label="Açık Talep" value={summary.openTickets} tone="blue" icon="inbox" foot="aktif kuyruk" />
            <KPI label="Toplam Talep" value={summary.totalTickets} tone="purple" icon="ticket" foot="tüm zamanlar" />
            <KPI label="SLA İhlal" value={summary.slaBreachCount} tone="red" icon="alert" alert foot="son 30 gün" />
            <KPI label="İhlal Oranı" value={summary.slaBreachRatePercent.toFixed(1)} unit="%" tone="orange" icon="shield" foot="hedef <5%" />
            <KPI label="Ort. Çözüm" value={summary.avgResolutionHours.toFixed(1)} unit="sa" tone="teal" icon="clock" />
            <KPI label="Ort. Puan" value={feedback ? feedback.averageRating.toFixed(1) : "—"} tone="amber" icon="star"
              foot={feedback ? <Stars value={feedback.averageRating} size={11} /> : "veri yok"} />
          </>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
        <Card title="Durum Dağılımı">
          {loadingSummary ? <SkChart h={180} /> : (
            <div className="row" style={{ gap: 16, alignItems: "center" }}>
              <Donut data={statusData} size={160} thickness={26} centerSub="toplam" />
              <div className="col" style={{ gap: 7 }}>
                {statusData.map((d) => (
                  <span key={d.label} className="legend-item">
                    <span className="sw" style={{ background: d.color }} />{d.label}<b>{d.value}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card title="Tür Dağılımı">
          {loadingSummary ? <SkChart h={180} /> : (
            <div className="col gap-3" style={{ paddingTop: 6 }}>
              <Donut data={typeData} size={160} thickness={26} centerLabel={summary?.totalTickets ?? 0} centerSub="talep" />
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
      </div>

      {overtime && overtime.length > 0 && (
        <Card
          title="Süre Aşımındaki Talepler"
          head={<span className="badge tone-red" style={{ fontSize: "var(--fs-micro)" }}>Öncelikli</span>}
          action={<span onClick={() => onNavigate({ name: "tickets" })}>Tümü →</span>}
          pad={false}
        >
          <table className="tbl">
            <thead><tr><th>ID</th><th>Başlık</th><th>Atanan</th><th>Öncelik</th><th>Durum</th><th style={{ width: 180 }}>SLA</th></tr></thead>
            <tbody>
              {overtime.slice(0, 5).map((t) => (
                <tr key={t.id} onClick={() => onOpenTicket(t.id)}>
                  <td className="col-id">#{t.id.slice(0, 8)}</td>
                  <td className="ttl" style={{ maxWidth: 360 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td>{t.assigneeId ? <Assignee id={t.assigneeId} name={formatActor(t.assigneeId)} /> : <span className="faint">—</span>}</td>
                  <td><PriorityPill priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.sla && <SLABar sla={t.sla} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Son Aktivite" action={<span onClick={() => onNavigate({ name: "tickets" })}>Tümü →</span>} pad={false}>
        {!tickets ? <SkRows n={6} /> : recent.length === 0 ? (
          <EmptyState icon="ticket" title="Henüz talep yok" body="Sistemde aktif talep bulunmuyor." />
        ) : (
          <table className="tbl">
            <thead><tr><th>ID</th><th>Başlık</th><th>Tür</th><th>Durum</th><th>Öncelik</th><th>Güncellendi</th></tr></thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} onClick={() => onOpenTicket(t.id)}>
                  <td className="col-id">#{t.id.slice(0, 8)}</td>
                  <td className="ttl" style={{ maxWidth: 360 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td><TypeBadge type={t.type} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><PriorityPill priority={t.priority} /></td>
                  <td className="faint nowrap">{formatRelative(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function AgentDashboard({ tickets, summary, onOpenTicket, onNavigate }: {
  tickets: Ticket[] | null;
  summary: SummaryReport | null;
  onOpenTicket: (id: string) => void;
  onNavigate: (v: AppView) => void;
}) {
  const { token } = useAuth();
  const myUsername = useMemo(() => {
    if (!token) return null;
    try {
      const p = parseJwtPayload(token);
      return (p.preferred_username ?? p.sub ?? null) as string | null;
    } catch { return null; }
  }, [token]);

  const my = useMemo(() => (tickets ?? []).filter((t) => t.assigneeId === myUsername), [tickets, myUsername]);
  const risk = useMemo(() => (tickets ?? []).filter((t) =>
    t.sla && ["RISK", "BREACH", "WARNING"].includes(t.sla.level) && t.status !== "CLOSED" && t.status !== "RESOLVED"
  ), [tickets]);

  const waitingCount = my.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length;
  const resolvedToday = useMemo(() => (tickets ?? []).filter((t) => {
    if (!t.resolvedAt) return false;
    const r = new Date(t.resolvedAt);
    const now = new Date();
    return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth() && r.getDate() === now.getDate();
  }).length, [tickets]);

  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
        {tickets === null ? Array.from({ length: 4 }).map((_, i) => <SkKPI key={i} />) : (
          <>
            <KPI label="Bana Atanan" value={my.length} tone="purple" icon="inbox" foot={`${my.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL").length} yüksek öncelik`} />
            <KPI label="Müşteri Bekliyor" value={waitingCount} tone="orange" icon="pause" />
            <KPI label="Bugün Çözülen" value={resolvedToday} tone="green" icon="check" />
            <KPI label="SLA Riski" value={risk.length} tone="red" icon="alert" alert={risk.length > 0} />
          </>
        )}
      </div>

      <Card title="SLA Riski Altındaki Talepler" head={<span className="badge tone-orange" style={{ fontSize: "var(--fs-micro)" }}>Öncelikli</span>} action={<span onClick={() => onNavigate({ name: "tickets" })}>Tümü →</span>} pad={false}>
        {tickets === null ? <SkRows n={4} /> : risk.length === 0 ? (
          <EmptyState icon="check" title="Risk yok" body="SLA riski altında bekleyen talep bulunmuyor." />
        ) : (
          <table className="tbl">
            <thead><tr><th>ID</th><th>Başlık</th><th>Öncelik</th><th>Durum</th><th style={{ width: 180 }}>SLA</th><th>Güncellendi</th></tr></thead>
            <tbody>
              {risk.slice(0, 6).map((t) => (
                <tr key={t.id} onClick={() => onOpenTicket(t.id)}>
                  <td className="col-id">#{t.id.slice(0, 8)}</td>
                  <td className="ttl" style={{ maxWidth: 320 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td><PriorityPill priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.sla && <SLABar sla={t.sla} />}</td>
                  <td className="faint nowrap">{formatRelative(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "start" }}>
        <Card title="Atanan Taleplerim" action={<span onClick={() => onNavigate({ name: "tickets" })}>Hepsi</span>} pad={false}>
          {tickets === null ? <SkRows n={4} /> : my.length === 0 ? (
            <EmptyState icon="inbox" title="Atanan talep yok" body="Şu anda sana atanmış aktif bir talep yok." />
          ) : (
            <table className="tbl">
              <thead><tr><th>ID</th><th>Başlık</th><th>Tür</th><th>Durum</th><th>Güncellendi</th></tr></thead>
              <tbody>
                {my.slice(0, 6).map((t) => (
                  <tr key={t.id} onClick={() => onOpenTicket(t.id)}>
                    <td className="col-id">#{t.id.slice(0, 8)}</td>
                    <td className="ttl" style={{ maxWidth: 240 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    </td>
                    <td><TypeBadge type={t.type} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="faint nowrap">{formatRelative(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Genel Durum">
          {summary === null ? <SkChart h={180} /> : (
            <div className="col gap-3">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="col"><span className="faint" style={{ fontSize: "var(--fs-cap)" }}>Açık</span><span className="big-num" style={{ fontSize: 24 }}>{summary.openTickets}</span></div>
                <div className="col"><span className="faint" style={{ fontSize: "var(--fs-cap)" }}>Çözülen</span><span className="big-num" style={{ fontSize: 24 }}>{summary.resolvedTotal}</span></div>
                <div className="col"><span className="faint" style={{ fontSize: "var(--fs-cap)" }}>İhlal</span><span className="big-num" style={{ fontSize: 24, color: "var(--red)" }}>{summary.slaBreachCount}</span></div>
              </div>
              <div className="divider" />
              <LineChart series={[{ name: "Açık talep", color: "#5b57d6", data: [-3, -1, -2, 0, 1, -1, 0].map((d) => Math.max(0, summary.openTickets + d)), fill: true }]} width={320} height={120} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CustomerDashboard({ tickets, recent, onOpenTicket, onCreateTicket, onNavigate }: {
  tickets: Ticket[] | null;
  recent: Ticket[];
  onOpenTicket: (id: string) => void;
  onCreateTicket: () => void;
  onNavigate: (v: AppView) => void;
}) {
  const active = (tickets ?? []).filter((t) => OPEN_STATUSES.includes(t.status));
  const pendingFeedback = (tickets ?? []).filter((t) => t.status === "CLOSED").length;
  return (
    <div className="col gap-4">
      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14 }}>
        <div className="card" style={{ background: "var(--accent)", border: "none", display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", color: "#fff" }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
            <Icon name="plus" size={24} strokeWidth={2} />
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ fontWeight: 650, fontSize: 16 }}>Yeni Talep Oluştur</span>
            <span style={{ fontSize: "var(--fs-sm)", opacity: .85 }}>Sorununuzu birkaç adımda iletin</span>
          </div>
          <button className="btn btn-lg" style={{ marginLeft: "auto", background: "#fff", color: "var(--accent)", border: "none" }} onClick={onCreateTicket}>
            Başla →
          </button>
        </div>
        {tickets === null ? <><SkKPI /><SkKPI /></> : (
          <>
            <KPI label="Aktif Taleplerim" value={active.length} tone="purple" icon="inbox" foot={`${active.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length} yanıt bekliyor`} />
            <KPI label="Toplam Talebim" value={tickets.length} tone="blue" icon="ticket" foot={`${pendingFeedback} kapalı`} />
          </>
        )}
      </div>

      <Card title="Son Taleplerim" action={<span onClick={() => onNavigate({ name: "tickets" })}>Tümünü gör →</span>} head={<span className="faint" style={{ fontSize: "var(--fs-cap)" }}>Son 6</span>}>
        {tickets === null ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkChart key={i} h={110} />)}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="Henüz talebiniz yok"
            body="Yeni bir talep oluşturarak başlayın."
            action={<button className="btn btn-primary btn-sm" onClick={onCreateTicket}><Icon name="plus" size={13} />Yeni Talep</button>}
          />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {recent.map((t) => (
              <div key={t.id} className="card card-pad" style={{ cursor: "pointer" }} onClick={() => onOpenTicket(t.id)}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
                  <span className="mono" style={{ fontSize: "var(--fs-cap)", color: "var(--text-tertiary)" }}>#{t.id.slice(0, 8)}</span>
                  <StatusBadge status={t.status} sm />
                </div>
                <div style={{ fontWeight: 550, fontSize: "var(--fs-body)", marginBottom: 10, lineHeight: 1.35 }}>{t.title}</div>
                <div className="row" style={{ gap: 8 }}>
                  <TypeBadge type={t.type} />
                  <span className="faint nowrap" style={{ fontSize: "var(--fs-cap)", marginLeft: "auto" }}>{formatRelative(t.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {pendingFeedback > 0 && (
        <WarnBanner action={<button className="btn btn-sm banner-act" style={{ borderColor: "color-mix(in srgb, var(--orange) 40%, var(--border))", color: "var(--orange)" }} onClick={() => onNavigate({ name: "tickets" })}>Değerlendir</button>}>
          <b>{pendingFeedback} kapalı talebiniz geri bildirim bekliyor.</b> Hizmet kalitesini değerlendirmek için tıklayın.
        </WarnBanner>
      )}
    </div>
  );
}
