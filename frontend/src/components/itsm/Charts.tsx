import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Tip = { x: number; y: number; html: string } | null;

function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const ref = useRef<HTMLDivElement>(null);
  const node = tip && (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y, opacity: 1 }} dangerouslySetInnerHTML={{ __html: tip.html }} />
  );
  return { tip, setTip, ref, node };
}

const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

function arcPath(cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, rOut, a0), [x1, y1] = polar(cx, cy, rOut, a1);
  const [x2, y2] = polar(cx, cy, rIn, a1), [x3, y3] = polar(cx, cy, rIn, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0} ${y0}A${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3}Z`;
}

export type DonutDatum = { label: string; value: number; color: string };

export function Donut({ data, size = 168, thickness = 26, centerLabel, centerSub }: { data: DonutDatum[]; size?: number; thickness?: number; centerLabel?: ReactNode; centerSub?: ReactNode }) {
  const { setTip, ref, node } = useTip();
  const [hi, setHi] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, rOut = size / 2 - 2, rIn = rOut - thickness;
  let ang = -Math.PI / 2;
  const segs = data.map((d) => {
    const a0 = ang, a1 = ang + (d.value / total) * Math.PI * 2;
    ang = a1;
    return { ...d, a0, a1 };
  });
  return (
    <div className="chart-wrap" ref={ref} style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={(rOut + rIn) / 2} fill="none" stroke="rgba(140,145,160,0.14)" strokeWidth={thickness} />
        {segs.map((s, i) => {
          const grow = hi === i ? 2 : 0;
          return (
            <path key={i} d={arcPath(cx, cy, rOut + grow, rIn - grow, s.a0, s.a1)}
              style={{ fill: s.color, transition: "opacity .12s", cursor: "pointer" }}
              opacity={hi === null || hi === i ? 1 : 0.3}
              onMouseEnter={() => setHi(i)}
              onMouseMove={(e) => {
                const r = ref.current!.getBoundingClientRect();
                setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${s.label}</b> · ${s.value} <span style="opacity:.7">(%${Math.round(s.value / total * 100)})</span>` });
              }}
              onMouseLeave={() => { setHi(null); setTip(null); }} />
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
        <div style={{ textAlign: "center" }}>
          <div className="big-num tnum" style={{ fontSize: 26 }}>{centerLabel ?? total}</div>
          {centerSub && <div className="faint" style={{ fontSize: "var(--fs-cap)", marginTop: 2 }}>{centerSub}</div>}
        </div>
      </div>
      {node}
    </div>
  );
}

export type LineSeries = { name: string; color: string; data: number[]; fill?: boolean };

export function LineChart({ series, width = 560, height = 180, pad = 26, yMax, fmt = (v) => String(v), xLabels }: { series: LineSeries[]; width?: number; height?: number; pad?: number; yMax?: number; fmt?: (v: number) => string; xLabels?: string[] }) {
  const { setTip, ref, node } = useTip();
  const [hx, setHx] = useState<number | null>(null);
  if (!series.length || !series[0].data.length) {
    return <div className="sk" style={{ height, width: "100%", borderRadius: 8 }} />;
  }
  const n = series[0].data.length;
  const max = yMax || Math.max(...series.flatMap((s) => s.data)) * 1.15 || 1;
  const X = (i: number) => pad + (i / (n - 1 || 1)) * (width - pad * 2);
  const Y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  return (
    <div className="chart-wrap" ref={ref} style={{ position: "relative" }}>
      <svg width={width} height={height}
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const mx = e.clientX - r.left;
          let i = Math.round(((mx - pad) / (width - pad * 2)) * (n - 1));
          i = Math.max(0, Math.min(n - 1, i));
          setHx(i);
          setTip({ x: X(i), y: 6, html: (xLabels ? `<span style="opacity:.7">${xLabels[i]}</span><br/>` : "") + series.map((s) => `<span style="color:${s.color}">●</span> ${s.name} <b>${fmt(s.data[i])}</b>`).join("&nbsp;&nbsp;") });
        }}
        onMouseLeave={() => { setHx(null); setTip(null); }}>
        {gridY.map((g, i) => (
          <g key={i}>
            <line x1={pad} x2={width - pad} y1={Y(g)} y2={Y(g)} style={{ stroke: "rgba(140,145,160,0.16)" }} strokeWidth="1" />
            <text x={pad - 6} y={Y(g) + 3} textAnchor="end" fontSize="9.5" style={{ fill: "var(--text-tertiary)" }}>{Math.round(g)}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const line = s.data.map((v, i) => `${i === 0 ? "M" : "L"}${X(i)} ${Y(v)}`).join(" ");
          const area = line + `L${X(n - 1)} ${height - pad}L${X(0)} ${height - pad}Z`;
          return (
            <g key={si}>
              {s.fill && <path d={area} style={{ fill: s.color }} opacity="0.1" />}
              <path d={line} fill="none" style={{ stroke: s.color }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {hx !== null && (
          <g>
            <line x1={X(hx)} x2={X(hx)} y1={pad - 6} y2={height - pad} style={{ stroke: "rgba(140,145,160,0.5)" }} strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s, si) => <circle key={si} cx={X(hx)} cy={Y(s.data[hx])} r="3.5" style={{ fill: "var(--bg-surface)", stroke: s.color }} strokeWidth="2.4" />)}
          </g>
        )}
      </svg>
      {node}
    </div>
  );
}

export type HBarDatum = { label: string; value: number; color: string; icon?: boolean };

export function HBar({ data, width = 320, barH = 22, gap = 12, valueFmt = (v) => String(v) }: { data: HBarDatum[]; width?: number; barH?: number; gap?: number; valueFmt?: (v: number) => string }) {
  const { setTip, ref, node } = useTip();
  if (!data.length) return <div className="empty"><Icon name="info" size={18} /><p>Veri yok</p></div>;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const labelW = 124, trackW = width - labelW - 44;
  const height = data.length * (barH + gap) - gap;
  return (
    <div className="chart-wrap" ref={ref} style={{ position: "relative" }}>
      <svg width={width} height={height}>
        {data.map((d, i) => {
          const y = i * (barH + gap);
          const w = Math.max(4, (d.value / max) * trackW);
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${d.label}</b> · ${valueFmt(d.value)}` }); }}
              onMouseLeave={() => setTip(null)}>
              {d.icon && <circle cx={5} cy={y + barH / 2} r="3.5" style={{ fill: d.color }} />}
              <text x={d.icon ? 14 : 0} y={y + barH / 2 + 4} fontSize="11.5" fontWeight="500" style={{ fill: "var(--text-secondary)" }}>{d.label}</text>
              <rect x={labelW} y={y} width={trackW} height={barH} rx="5" style={{ fill: "rgba(140,145,160,0.16)" }} />
              <rect x={labelW} y={y} width={w} height={barH} rx="5" style={{ fill: d.color }} />
              <text x={labelW + w + 8} y={y + barH / 2 + 4} fontSize="11.5" fontWeight="700" style={{ fill: "var(--text-primary)" }}>{valueFmt(d.value)}</text>
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

export type StackedCategory = { label: string; total: number; values: Record<string, number> };
export type StackedKey = { id: string; label: string; color: string };

export function StackedBar({ categories, keys, width = 520, height = 200, pad = 30 }: { categories: StackedCategory[]; keys: StackedKey[]; width?: number; height?: number; pad?: number }) {
  const { setTip, ref, node } = useTip();
  const max = Math.max(...categories.map((c) => keys.reduce((s, k) => s + (c.values[k.id] || 0), 0))) || 1;
  const bw = Math.min(48, (width - pad * 2) / categories.length - 18);
  const step = (width - pad * 2) / categories.length;
  const Y = (v: number) => (v / max) * (height - pad * 2);
  return (
    <div className="chart-wrap" ref={ref} style={{ position: "relative" }}>
      <svg width={width} height={height}>
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={pad} x2={width - pad} y1={height - pad - t * (height - pad * 2)} y2={height - pad - t * (height - pad * 2)} style={{ stroke: "rgba(140,145,160,0.16)" }} />
        ))}
        {categories.map((c, ci) => {
          const x = pad + ci * step + (step - bw) / 2;
          let yCursor = height - pad;
          return (
            <g key={ci}>
              {keys.map((k) => {
                const v = c.values[k.id] || 0;
                if (!v) return null;
                const h = Y(v);
                yCursor -= h;
                const yy = yCursor;
                return (
                  <rect key={k.id} x={x} y={yy + 1} width={bw} height={Math.max(0, h - 1.5)} rx="2.5"
                    style={{ fill: k.color, cursor: "pointer" }}
                    onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `<b>${c.label}</b><br/>${k.label}: <b>${v}</b>` }); }}
                    onMouseLeave={() => setTip(null)} />
                );
              })}
              <text x={x + bw / 2} y={height - pad + 15} textAnchor="middle" fontSize="11" fontWeight="500" style={{ fill: "var(--text-secondary)" }}>{c.label}</text>
              <text x={x + bw / 2} y={yCursor - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" style={{ fill: "var(--text-primary)" }}>{c.total}</text>
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

export function Gauge({ value, size = 168, thickness = 16, color = "#138a44", label, sub }: { value: number; size?: number; thickness?: number; color?: string; label?: ReactNode; sub?: ReactNode }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2 - 2;
  const a0 = Math.PI, a1 = Math.PI * 2;
  const frac = Math.min(value, 100) / 100;
  const aV = a0 + frac * Math.PI;
  const track = `M${polar(cx, cy, r, a0).join(" ")}A${r} ${r} 0 0 1 ${polar(cx, cy, r, a1).join(" ")}`;
  const fill = `M${polar(cx, cy, r, a0).join(" ")}A${r} ${r} 0 0 1 ${polar(cx, cy, r, aV).join(" ")}`;
  return (
    <div style={{ width: size, height: size / 2 + 20, position: "relative" }}>
      <svg width={size} height={size / 2 + 20}>
        <path d={track} fill="none" style={{ stroke: "rgba(140,145,160,0.18)" }} strokeWidth={thickness} strokeLinecap="round" />
        <path d={fill} fill="none" style={{ stroke: color }} strokeWidth={thickness} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: size / 2 - 26, textAlign: "center" }}>
        <div className="big-num tnum" style={{ fontSize: 28, color }}>{label}</div>
        {sub && <div className="faint" style={{ fontSize: "var(--fs-cap)" }}>{sub}</div>}
      </div>
    </div>
  );
}

export function RatingDist({ dist, total, width = 280 }: { dist: Record<number, number>; total: number; width?: number }) {
  const { setTip, ref, node } = useTip();
  const max = Math.max(...Object.values(dist)) || 1;
  return (
    <div className="chart-wrap" ref={ref} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, width }}>
      {[5, 4, 3, 2, 1].map((star) => {
        const v = dist[star] || 0;
        return (
          <div key={star} className="row" style={{ gap: 9 }}
            onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, html: `${star}★ · <b>${v}</b> (%${total ? Math.round(v / total * 100) : 0})` }); }}
            onMouseLeave={() => setTip(null)}>
            <span className="row" style={{ gap: 2, width: 30, fontSize: "var(--fs-cap)", color: "var(--text-secondary)", fontWeight: 700 }}>
              {star}<Icon name="star" size={10} fill className="star-full" />
            </span>
            <div className="sla-track" style={{ flex: 1, height: 8 }}>
              <div className="sla-fill" style={{ width: (v / max * 100) + "%", background: "var(--amber)" }} />
            </div>
            <span className="tnum" style={{ width: 24, textAlign: "right", fontSize: "var(--fs-cap)", color: "var(--text-secondary)", fontWeight: 600 }}>{v}</span>
          </div>
        );
      })}
      {node}
    </div>
  );
}

export function AreaChart({ data, labels, width = 720, height = 200, pad = 30, color = "#5b57d6", fmt = (v) => String(v), threshold, thresholdLabel }: { data: number[]; labels?: string[]; width?: number; height?: number; pad?: number; color?: string; fmt?: (v: number) => string; threshold?: number; thresholdLabel?: string }) {
  const { setTip, ref, node } = useTip();
  const [hx, setHx] = useState<number | null>(null);
  if (!data.length) return <div className="sk" style={{ height, width: "100%", borderRadius: 8 }} />;
  const n = data.length;
  const max = Math.max(...data) * 1.18 || 1;
  const X = (i: number) => pad + (i / (n - 1 || 1)) * (width - pad * 2);
  const Y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${X(i)} ${Y(v)}`).join(" ");
  const area = line + `L${X(n - 1)} ${height - pad}L${X(0)} ${height - pad}Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const gid = "g" + Math.random().toString(36).slice(2, 8);
  return (
    <div className="chart-wrap" ref={ref} style={{ position: "relative" }}>
      <svg width={width} height={height}
        onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); const mx = e.clientX - r.left; let i = Math.round(((mx - pad) / (width - pad * 2)) * (n - 1)); i = Math.max(0, Math.min(n - 1, i)); setHx(i); setTip({ x: X(i), y: 4, html: `${labels ? labels[i] + "<br/>" : ""}<b>${fmt(data[i])}</b>` }); }}
        onMouseLeave={() => { setHx(null); setTip(null); }}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.34" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {gridY.map((g, i) => <g key={i}><line x1={pad} x2={width - pad} y1={Y(g)} y2={Y(g)} style={{ stroke: "rgba(140,145,160,0.16)" }} /><text x={pad - 6} y={Y(g) + 3} textAnchor="end" fontSize="9.5" style={{ fill: "var(--text-tertiary)" }}>{Math.round(g)}</text></g>)}
        {threshold != null && (
          <>
            <line x1={pad} x2={width - pad} y1={Y(threshold)} y2={Y(threshold)} style={{ stroke: "#d12830" }} strokeWidth="1.2" strokeDasharray="4 4" />
            {thresholdLabel && <text x={width - pad} y={Y(threshold) - 5} textAnchor="end" fontSize="9.5" fontWeight="600" style={{ fill: "#d12830" }}>{thresholdLabel}</text>}
          </>
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" style={{ stroke: color }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {hx !== null && <g><line x1={X(hx)} x2={X(hx)} y1={pad - 4} y2={height - pad} style={{ stroke: "rgba(140,145,160,0.5)" }} strokeWidth="1" strokeDasharray="3 3" /><circle cx={X(hx)} cy={Y(data[hx])} r="4" style={{ fill: "var(--bg-surface)", stroke: color }} strokeWidth="2.4" /></g>}
      </svg>
      {node}
    </div>
  );
}
