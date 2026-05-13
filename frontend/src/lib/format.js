/**
 * Format an ISO date string as a localized short date.
 */
export const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
});
/**
 * Format an ISO date string as a localized short date+time.
 */
export const formatDateTime = (iso) => new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});
/**
 * Format an ISO date string as a relative time ("3 minutes ago", "2 days ago").
 * Falls back to formatDate for very old timestamps.
 */
export const formatRelative = (iso) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    if (seconds < 60)
        return rtf.format(-seconds, "second");
    if (minutes < 60)
        return rtf.format(-minutes, "minute");
    if (hours < 24)
        return rtf.format(-hours, "hour");
    if (days < 14)
        return rtf.format(-days, "day");
    return formatDate(iso);
};
/**
 * Short username from a possibly-long actor identifier (UUID, email).
 */
export const formatActor = (id) => {
    if (!id)
        return "System";
    if (id.includes("@"))
        return id.split("@")[0];
    if (id.length > 16)
        return `${id.slice(0, 8)}…`;
    return id;
};
