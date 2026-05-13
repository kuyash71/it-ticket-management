/**
 * Placeholder ITSM brand mark. Geometric "Chevron in rounded square".
 * Single-color via currentColor — adapts to theme automatically.
 * Replace `Logo` exports with user-provided SVGs when ready.
 */
type LogoProps = { size?: number; className?: string };

export const LogoMark = ({ size = 26, className }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="currentColor" />
    <path
      d="M9.5 13.5 16 19.5l6.5-6"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="11.5" r="1.6" fill="white" />
  </svg>
);

export const LogoWordmark = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
    ITSM
    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>desk</span>
  </span>
);
