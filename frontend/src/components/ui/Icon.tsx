import type { SVGProps } from "react";

/**
 * Minimal lucide-style icon set. Each icon: 16x16 viewBox, stroke 1.75, currentColor.
 * Kept inline (no extra dep) per the docs' frontend stack.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (props: IconProps) => {
  const { size = 16, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: ["icon", rest.className].filter(Boolean).join(" "),
    ...rest
  };
};

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="7" cy="7" r="5"/><path d="m14 14-3.5-3.5"/></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 3v10M3 8h10"/></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 3l10 10M13 3 3 13"/></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="m3 8 3.5 3.5L13 5"/></svg>
);
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m4 6 4 4 4-4"/></svg>
);
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 4 4 4-4 4"/></svg>
);
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="m10 4-4 4 4 4"/></svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M13 8H3M7 4 3 8l4 4"/></svg>
);
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 8h10M9 4l4 4-4 4"/></svg>
);
export const IconInbox = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 8v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8M2 8l2-5h8l2 5M2 8h3.5l1 2h3l1-2H14"/></svg>
);
export const IconLayoutDashboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="3" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="7" width="5" height="7" rx="1"/></svg>
);
export const IconBarChart = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 13V8M8 13V3M13 13v-7"/></svg>
);
export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.5M8 13v1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M1.5 8H3M13 8h1.5M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>
);
export const IconSun = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M3 3l1 1M12 12l1 1M1.5 8H3M13 8h1.5M3 13l1-1M12 4l1-1"/></svg>
);
export const IconMoon = (p: IconProps) => (
  <svg {...base(p)}><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"/></svg>
);
export const IconMonitor = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M5 14h6M8 11v3"/></svg>
);
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>
);
export const IconLogOut = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6M11 5l3 3-3 3M14 8H6"/></svg>
);
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 14a5.5 5.5 0 0 1 11 0"/></svg>
);
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6a4 4 0 1 1 8 0v3l1.5 2.5h-11L4 9V6ZM6 13.5a2 2 0 0 0 4 0"/></svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>
);
export const IconAlertCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.01"/></svg>
);
export const IconAlertTriangle = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 2 1.5 13.5h13L8 2Z"/><path d="M8 7v3M8 12v.01"/></svg>
);
export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><path d="m5 8 2 2 4-4"/></svg>
);
export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5M8 5v.01"/></svg>
);
export const IconLifeBuoy = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/><path d="M3.7 3.7 6.2 6.2M9.8 9.8l2.5 2.5M3.7 12.3l2.5-2.5M9.8 6.2l2.5-2.5"/></svg>
);
export const IconWrench = (p: IconProps) => (
  <svg {...base(p)}><path d="M11 2a3 3 0 0 0-2.8 4l-5.7 5.7a1.5 1.5 0 0 0 2.1 2.1L10.3 8.1A3 3 0 1 0 11 2.1"/></svg>
);
export const IconCircleDot = (p: IconProps) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
);
export const IconMessageSquare = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 3h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6l-3 2.5V4a1 1 0 0 1 1-1Z"/></svg>
);
export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 3h12l-4.5 6V14L6.5 12V9L2 3Z"/></svg>
);
export const IconMoreHorizontal = (p: IconProps) => (
  <svg {...base(p)}><circle cx="3.5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12.5" cy="8" r="1" fill="currentColor"/></svg>
);
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 8a6 6 0 0 1 10.2-4.3M14 8a6 6 0 0 1-10.2 4.3M11 2v3h3M5 14v-3H2"/></svg>
);
export const IconPaperclip = (p: IconProps) => (
  <svg {...base(p)}><path d="m13.5 7.5-5.6 5.6a3 3 0 1 1-4.2-4.2l6.4-6.4a2 2 0 1 1 2.8 2.8l-6.4 6.4a1 1 0 1 1-1.4-1.4l5.6-5.6"/></svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 1.5v9m0 0L5 7.5m3 3 3-3M2 12.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/></svg>
);
export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 14.5v-9m0 0L5 8.5m3-3 3 3M2 2.5v-1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" transform="translate(0 0)"/><path d="M2 12.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/></svg>
);
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 6h12M5 1.5v3M11 1.5v3"/></svg>
);
export const IconTrend = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 11.5 6 7l3 3 5-6M10 4.5h4v4"/></svg>
);
