import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export function Card({
  title,
  action,
  children,
  pad = true,
  className = "",
  style,
  head
}: {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  pad?: boolean;
  className?: string;
  style?: CSSProperties;
  head?: ReactNode;
}) {
  return (
    <div className={"card " + className} style={style}>
      {(title || head) && (
        <div className="card-head">
          {title && <span className="card-title">{title}</span>}
          {head}
          <span className="spacer" />
          {action && <span className="card-action">{action}</span>}
        </div>
      )}
      <div className={pad ? "card-pad" : ""}>{children}</div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: ReactNode }[] }) {
  return (
    <div className="legend">
      {items.map((it, i) => (
        <span key={i} className="legend-item">
          <span className="sw" style={{ background: it.color }} />{it.label}{it.value != null && <b>{it.value}</b>}
        </span>
      ))}
    </div>
  );
}

export function Sk({ w, h = 12, r = 4, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkKPI() {
  return (
    <div className="card kpi">
      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
        <Sk w={28} h={28} r={6} />
        <Sk w={86} h={10} />
      </div>
      <Sk w={84} h={26} style={{ marginTop: 12 }} />
      <Sk w={56} h={9} style={{ marginTop: 12 }} />
    </div>
  );
}

export function SkRows({ n = 6 }: { n?: number }) {
  return (
    <div className="col">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="row" style={{ gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--border-faint)" }}>
          <Sk w={52} h={10} /><Sk w={"34%"} h={11} /><Sk w={68} h={18} r={9} /><Sk w={60} h={18} r={9} />
          <span style={{ flex: 1 }} /><Sk w={90} h={10} /><Sk w={70} h={10} />
        </div>
      ))}
    </div>
  );
}

export function SkChart({ h = 180 }: { h?: number }) {
  return <div className="sk" style={{ width: "100%", height: h, borderRadius: 8 }} />;
}

export function EmptyState({
  icon = "inbox",
  title,
  body,
  action
}: {
  icon?: IconName;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ msg = "Veriler yüklenemedi.", onRetry }: { msg?: ReactNode; onRetry?: () => void }) {
  return (
    <div className="banner error">
      <Icon name="alert" size={16} />
      <span><b>Bağlantı hatası.</b> {msg}</span>
      {onRetry && (
        <button className="btn btn-sm btn-danger banner-act" onClick={onRetry}>
          <Icon name="refresh" size={12} />Yeniden dene
        </button>
      )}
    </div>
  );
}

export function WarnBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="banner warn">
      <Icon name="alert" size={16} />
      <span>{children}</span>
      {action}
    </div>
  );
}
