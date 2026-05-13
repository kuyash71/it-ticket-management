import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
/**
 * SLA countdown + progress bar (Doc §3.2.1 screenshot, §6.7 escalation).
 * Re-renders every second while the clock is RUNNING so the countdown stays live.
 */
export const SlaPanel = ({ sla }) => {
    const { t } = useTranslation();
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (sla.clockState !== "RUNNING")
            return;
        const id = window.setInterval(() => setTick((n) => n + 1), 1000);
        return () => window.clearInterval(id);
    }, [sla.clockState]);
    // Local seconds elapsed since the snapshot was taken
    const localElapsed = sla.clockState === "RUNNING"
        ? sla.elapsedSeconds + tick
        : sla.elapsedSeconds;
    const localRemaining = sla.deadlineSeconds - localElapsed;
    const localPercent = sla.deadlineSeconds > 0
        ? Math.min(100, Math.max(0, (localElapsed / sla.deadlineSeconds) * 100))
        : 0;
    // Re-evaluate level locally (server caches the highest seen; we want the live view)
    const liveLevel = derivedLevel(localPercent);
    const breached = localRemaining < 0;
    const levelStyles = LEVEL_STYLES[liveLevel];
    return (_jsxs("div", { className: "side-section", "data-sla-level": liveLevel, children: [_jsx("div", { className: "side-section-header", children: _jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }, children: [t("sla.title"), _jsx("span", { style: {
                                fontSize: "0.625rem",
                                fontWeight: "var(--weight-semibold)",
                                padding: "1px 6px",
                                borderRadius: "var(--radius-sm)",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                background: levelStyles.badgeBg,
                                color: levelStyles.badgeColor,
                            }, children: t(`sla.level.${liveLevel.toLowerCase()}`) })] }) }), _jsxs("div", { className: "side-section-body", style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-1)" }, children: [_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "baseline",
                                    justifyContent: "space-between",
                                }, children: [_jsx("span", { style: {
                                            fontSize: "var(--text-lg)",
                                            fontWeight: "var(--weight-semibold)",
                                            fontFamily: "var(--font-mono)",
                                            color: levelStyles.textColor,
                                            fontVariantNumeric: "tabular-nums",
                                        }, children: breached
                                            ? `+${formatDuration(Math.abs(localRemaining))}`
                                            : formatDuration(localRemaining) }), _jsx("span", { className: "text-muted text-xs", children: breached ? t("sla.overdue") : t("sla.remaining") })] }), sla.clockState === "PAUSED" && (_jsx("div", { className: "text-muted text-xs", style: { fontStyle: "italic" }, children: t("sla.clock.paused") })), sla.clockState === "STOPPED" && (_jsx("div", { className: "text-muted text-xs", style: { fontStyle: "italic" }, children: t("sla.clock.stopped") }))] }), _jsx("div", { style: {
                            width: "100%",
                            height: 6,
                            borderRadius: 999,
                            background: "var(--bg-muted)",
                            overflow: "hidden",
                        }, "aria-label": t("sla.progress"), role: "progressbar", "aria-valuenow": Math.round(localPercent), "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { style: {
                                width: `${Math.min(localPercent, 100)}%`,
                                height: "100%",
                                background: levelStyles.barColor,
                                transition: "width 0.3s linear, background 0.2s ease",
                            } }) }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "var(--text-xs)" }, children: [_jsxs("span", { children: [formatDuration(localElapsed), " ", t("sla.elapsed")] }), _jsxs("span", { children: [Math.round(localPercent), "%"] }), _jsxs("span", { children: [formatDuration(sla.deadlineSeconds), " ", t("sla.target")] })] })] })] }));
};
const LEVEL_STYLES = {
    NORMAL: {
        badgeBg: "rgba(34, 197, 94, 0.18)",
        badgeColor: "#86efac",
        barColor: "#22c55e",
        textColor: "var(--text)",
    },
    WARNING: {
        badgeBg: "rgba(245, 158, 11, 0.18)",
        badgeColor: "#fcd34d",
        barColor: "#f59e0b",
        textColor: "var(--text)",
    },
    RISK: {
        badgeBg: "rgba(249, 115, 22, 0.18)",
        badgeColor: "#fdba74",
        barColor: "#f97316",
        textColor: "var(--text)",
    },
    BREACH: {
        badgeBg: "rgba(239, 68, 68, 0.18)",
        badgeColor: "#fca5a5",
        barColor: "#ef4444",
        textColor: "#fca5a5",
    },
};
function derivedLevel(percent) {
    if (percent >= 100)
        return "BREACH";
    if (percent >= 85)
        return "RISK";
    if (percent >= 70)
        return "WARNING";
    return "NORMAL";
}
function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (days > 0)
        return `${days}d ${hours}h ${mins}m`;
    if (hours > 0)
        return `${hours}h ${mins}m`;
    if (mins > 0)
        return `${mins}m ${secs}s`;
    return `${secs}s`;
}
