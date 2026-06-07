import type { CSSProperties } from "react";

const ICONS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  pause: "M9 5v14M15 5v14",
  check: "M5 13l4 4L19 7",
  lock: "M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z",
  alert: "M12 9v4M12 17h.01M10.3 4.3L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  comment: "M21 11.5a8.4 8.4 0 01-9 8.4 8.5 8.5 0 01-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 1121 11.5z",
  pencil: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 004.6 15H4.5a2 2 0 110-4h.1A1.6 1.6 0 005.7 8.3l-.1-.1A2 2 0 118.4 5.4l.1.1A1.6 1.6 0 0011 4.6V4.5a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V11a1.6 1.6 0 001.5 1h.1a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z",
  paperclip: "M21.4 11.1L12.3 20a5 5 0 01-7-7l9-9a3.3 3.3 0 014.7 4.7l-9 9a1.7 1.7 0 01-2.4-2.4l8.5-8.4",
  star: "M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.4 19.6l1-6L3 9.4l6-.9z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  ticket: "M3 9a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4zM13 7v10",
  report: "M3 3v18h18M8 14v4M13 9v9M18 5v13",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 004.6 15H4.5a2 2 0 110-4h.1A1.6 1.6 0 005.7 8.3l-.1-.1A2 2 0 118.4 5.4l.1.1A1.6 1.6 0 0011 4.6V4.5a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V11a1.6 1.6 0 001.5 1h.1a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z",
  inbox: "M3 12h6l2 3h2l2-3h6M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  chevdown: "M6 9l6 6 6-6",
  chevright: "M9 6l6 6-6 6",
  arrowup: "M12 19V5M5 12l7-7 7 7",
  arrowdown: "M12 5v14M19 12l-7 7-7-7",
  more: "M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z",
  x: "M18 6L6 18M6 6l12 12",
  clock: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z",
  refresh: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
  shield: "M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  users: "M17 21v-2a4 4 0 00-3-3.9M9 21v-2a4 4 0 014-4h0M9 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.9",
  info: "M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  flag: "M4 22V4M4 4l5-1 6 2 5-1v11l-5 1-6-2-5 1",
  sparkle: "M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3zM19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  link: "M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M8.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  filter: "M3 5h18l-7 8v5l-4 2v-7z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  reopen: "M3 3v5h5M3.5 9a9 9 0 102-3.3L3 8",
  zap: "M13 2L3 14h7l-1 8 10-12h-7z",
  spin: "M12 3a9 9 0 100 18M12 3a9 9 0 019 9",
  building: "M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 21V11h4v10M8 7h2M8 11h2M8 15h2",
  copy: "M9 9h10v10H9zM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1",
  thumbsdown: "M10 15v4a3 3 0 003 3l4-9V2H5.7a2 2 0 00-2 1.7l-1.4 9A2 2 0 004.3 16H10zM17 2h2.7A2 2 0 0122 3.7V12a2 2 0 01-2 2h-3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
};

export type IconName = keyof typeof ICONS | string;

export type IconProps = {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
  fill?: boolean;
  strokeWidth?: number;
};

export function Icon({ name, size = 16, style, className, fill = false, strokeWidth = 1.6 }: IconProps) {
  const d = ICONS[name] ?? ICONS.info;
  const segments = d.split("M").filter(Boolean).map((seg) => "M" + seg);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {segments.map((seg, i) => <path key={i} d={seg} />)}
    </svg>
  );
}
