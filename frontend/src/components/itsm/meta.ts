import type { IconName } from "./Icon";
import type { TicketPriority, TicketStatus, TicketType, ApprovalState, SLALevel } from "../../types/api";

export const STATUS_META: Record<TicketStatus, { label: string; tone: string; icon: IconName }> = {
  NEW: { label: "Yeni", tone: "tone-blue", icon: "plus" },
  IN_PROGRESS: { label: "İşlemde", tone: "tone-purple", icon: "spin" },
  WAITING_FOR_CUSTOMER: { label: "Müşteri Bekliyor", tone: "tone-orange", icon: "pause" },
  RESOLVED: { label: "Çözüldü", tone: "tone-green", icon: "check" },
  CLOSED: { label: "Kapandı", tone: "tone-gray", icon: "lock" }
};

export const PRIORITY_META: Record<TicketPriority, { label: string; tone: string }> = {
  LOW: { label: "Düşük", tone: "gray" },
  MEDIUM: { label: "Orta", tone: "amber" },
  HIGH: { label: "Yüksek", tone: "orange" },
  CRITICAL: { label: "Kritik", tone: "red" }
};

export const TYPE_META: Record<TicketType, { label: string; tone: string; icon: IconName }> = {
  INCIDENT: { label: "Olay", tone: "tone-red", icon: "alert" },
  SERVICE_REQUEST: { label: "Hizmet Talebi", tone: "tone-blue", icon: "list" }
};

export const SLA_LEVEL_META: Record<SLALevel, { label: string; cls: string }> = {
  NORMAL: { label: "Normal", cls: "lvl-normal" },
  WARNING: { label: "Uyarı", cls: "lvl-warning" },
  RISK: { label: "Riskli", cls: "lvl-risk" },
  BREACH: { label: "İhlal", cls: "lvl-breach" }
};

export const STATUS_HEX: Record<TicketStatus, string> = {
  NEW: "#2563eb",
  IN_PROGRESS: "#6e45e6",
  WAITING_FOR_CUSTOMER: "#B0512F",
  RESOLVED: "#11874a",
  CLOSED: "#6C757D"
};

export const APPROVAL_META: Record<ApprovalState, { label: string; tone: string }> = {
  PENDING: { label: "Onay Bekliyor", tone: "tone-amber" },
  APPROVED: { label: "Onaylandı", tone: "tone-green" },
  REJECTED: { label: "Reddedildi", tone: "tone-red" }
};

const PALETTE = [
  "#5b57d6", "#18a957", "#e8820c", "#2f6bff", "#7c5cff",
  "#d9a200", "#e5484d", "#0d9488", "#8a8f9a", "#c63d8a"
];

export function colorFromString(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}
