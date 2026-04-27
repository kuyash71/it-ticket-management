package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;

public class SLAEscalationService implements SLAEscalationPolicy{

    @Override
    public SLAEscalationLevel evaluate(long elapsed, long deadline) {
        var completed = elapsed / (double)deadline;
        if(completed >= 1.0) return SLAEscalationLevel.BREACH;
        else if(completed >= 0.85) return SLAEscalationLevel.RISK;
        else if(completed>=0.7) return SLAEscalationLevel.WARNING;
        else if(completed >= 0) return SLAEscalationLevel.NORMAL;
        else throw new RuntimeException("Invalid Completion Ratio: " + "ELAPSED: " + elapsed + " DEADLINE: " + deadline);
    }
}
