import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import {
  STATUS_META,
  PRIORITY_META,
  TYPE_META,
  SLA_LEVEL_META,
  APPROVAL_META,
  colorFromString,
  initialsFromName
} from "./meta";
import type {
  TicketStatus,
  TicketPriority,
  TicketType,
  ApprovalState,
  SlaInfo,
  Visibility
} from "../../types/api";

export function StatusBadge({ status, sm }: { status: TicketStatus; sm?: boolean }) {
  const s = STATUS_META[status];
  return (
    <span className={"badge " + s.tone} style={sm ? { fontSize: "var(--fs-micro)", padding: "1px 7px" } : undefined}>
      <Icon name={s.icon} size={11} className="ic" strokeWidth={2.4} />{s.label}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: TicketPriority }) {
  const p = PRIORITY_META[priority];
  return (
    <span className={"prio " + (priority === "CRITICAL" ? "crit" : "")}>
      <span className="bar" style={{ ["--tone" as any]: `var(--${p.tone})` }} />
      {p.label}
    </span>
  );
}

export function TypeBadge({ type, icon = true }: { type: TicketType; icon?: boolean }) {
  const t = TYPE_META[type];
  return (
    <span className={"badge " + t.tone}>
      {icon && <Icon name={t.icon} size={11} className="ic" strokeWidth={2} />}{t.label}
    </span>
  );
}

export function VisibilityPill({ vis }: { vis: Visibility }) {
  if (vis === "INTERNAL") return <span className="vis int"><Icon name="lock" size={9} strokeWidth={2.2} />Dahili</span>;
  return <span className="vis ext"><Icon name="globe" size={9} strokeWidth={2.2} />Genel</span>;
}

export function ApprovalPill({ state }: { state: ApprovalState }) {
  const m = APPROVAL_META[state];
  return <span className={"badge " + m.tone}>{m.label}</span>;
}

export function SLABar({ sla, showMeta = true, width }: { sla: SlaInfo; showMeta?: boolean; width?: number }) {
  const lvl = SLA_LEVEL_META[sla.level];
  const pct = Math.min(Math.max(sla.progressPercent, 0), 100);
  const remaining = formatRemaining(sla.remainingSeconds);
  return (
    <div className={"sla " + lvl.cls + (sla.level === "BREACH" ? " breach" : "")} style={width ? { minWidth: width } : undefined}>
      <div className="sla-track"><div className="sla-fill" style={{ width: pct + "%" }} /></div>
      {showMeta && (
        <div className="sla-meta">
          <span><b>{lvl.label}</b> · %{Math.round(sla.progressPercent)}</span>
          <span>{remaining}</span>
        </div>
      )}
    </div>
  );
}

function formatRemaining(secs: number): string {
  if (secs <= 0) return "Aşıldı";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h >= 24) return Math.floor(h / 24) + "g " + (h % 24) + "sa";
  if (h > 0) return h + "sa " + m + "dk";
  return m + " dk";
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} fill={i <= Math.round(value)}
          strokeWidth={1.6} className={i <= Math.round(value) ? "star-full" : "star-empty"} />
      ))}
    </span>
  );
}

export type AvatarSize = "sm" | "md" | "lg";
export function Avatar({ id, name, color, size = "md", ring }: { id?: string; name?: string; color?: string; size?: AvatarSize; ring?: boolean }) {
  const display = name || id || "?";
  const col = color || colorFromString(display);
  return <span className={`av av-${size} ${ring ? "av-ring" : ""}`} style={{ background: col }} title={display}>{initialsFromName(display)}</span>;
}

export function Assignee({ id, name, role, sub }: { id?: string | null; name?: string; role?: string; sub?: boolean }) {
  if (!id && !name) {
    return (
      <span className="row faint" style={{ fontSize: "var(--fs-sm)" }}>
        <span className="av av-sm" style={{ background: "var(--bg-inset)", color: "var(--text-tertiary)" }}>?</span>
        Atanmadı
      </span>
    );
  }
  const display = name || id || "?";
  return (
    <span className="cell-assignee">
      <Avatar id={id ?? undefined} name={display} size="sm" />
      <span className="col" style={{ lineHeight: 1.2 }}>
        <span style={{ fontWeight: 500 }}>{display}</span>
        {sub && role && <span className="sub">{role}</span>}
      </span>
    </span>
  );
}

export type KPITone = "blue" | "purple" | "orange" | "green" | "amber" | "red" | "gray" | "teal" | "pink";

export type KPIProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: KPITone;
  icon?: IconName;
  trend?: { dir: "up" | "down" | "warn"; val: string; good?: boolean };
  foot?: ReactNode;
  alert?: boolean;
  spark?: ReactNode;
};

export function KPI({ label, value, unit, tone = "gray", icon = "sparkle", trend, foot, alert, spark }: KPIProps) {
  const toneVar = `var(--${tone})`;
  return (
    <div className={"card kpi" + (alert ? " alert" : "")} style={{ ["--tone" as any]: toneVar } as CSSProperties}>
      <div className="kpi-head">
        <div className="kpi-ic"><Icon name={icon} size={15} strokeWidth={2} /></div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value tnum">{value}{unit && <small>{unit}</small>}</div>
      <div className="kpi-foot">
        {trend && (
          <span className={"trend " + trend.dir + (trend.good ? " good" : "")}>
            <Icon name={trend.dir === "down" ? "arrowdown" : trend.dir === "warn" ? "alert" : "arrowup"} size={11} strokeWidth={2.4} />{trend.val}
          </span>
        )}
        {foot && <span>{foot}</span>}
      </div>
      {spark && <div className="kpi-spark">{spark}</div>}
    </div>
  );
}

export function Spark({ data, w = 56, h = 22, color = "var(--text-tertiary)" }: { data: number[]; w?: number; h?: number; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / rng) * (h - 3) - 1.5}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" style={{ stroke: color }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}
