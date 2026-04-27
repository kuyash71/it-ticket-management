package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;

public interface SLAEscalationPolicy {
    public SLAEscalationLevel evaluate(long elapsed, long deadline);
}
