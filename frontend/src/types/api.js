/**
 * Plain status-change transitions (no verification required):
 *   NEW → IN_PROGRESS / WAITING_FOR_CUSTOMER
 *   IN_PROGRESS → WAITING_FOR_CUSTOMER
 *   WAITING_FOR_CUSTOMER → IN_PROGRESS
 *
 * Verified transitions go through dedicated endpoints:
 *   IN_PROGRESS → RESOLVED   → POST /resolve  (body: resolutionNote)
 *   RESOLVED → CLOSED        → POST /confirm-close (CUSTOMER) or /force-close (MANAGER, body: reason)
 */
export const PLAIN_STATUS_TRANSITIONS = {
    NEW: ["IN_PROGRESS", "WAITING_FOR_CUSTOMER"],
    IN_PROGRESS: ["WAITING_FOR_CUSTOMER"],
    WAITING_FOR_CUSTOMER: ["IN_PROGRESS"],
    RESOLVED: [],
    CLOSED: [],
};
