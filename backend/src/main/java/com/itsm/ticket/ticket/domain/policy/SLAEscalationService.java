package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;

/** Threshold ladder: ≥70 % WARNING, ≥85 % RISK, ≥100 % BREACH (Doc §6.7). */
public class SLAEscalationService implements SLAEscalationPolicy{

    @Override
    public SLAEscalationLevel evaluate(long elapsed, long deadline) {
        if (deadline <= 0) {
            throw new IllegalArgumentException("Deadline must be positive, got: " + deadline);
        }
        double completed = elapsed / (double) deadline;
        if (completed >= 1.0) return SLAEscalationLevel.BREACH;
        if (completed >= 0.85) return SLAEscalationLevel.RISK;
        if (completed >= 0.70) return SLAEscalationLevel.WARNING;
        return SLAEscalationLevel.NORMAL;
    }
}
