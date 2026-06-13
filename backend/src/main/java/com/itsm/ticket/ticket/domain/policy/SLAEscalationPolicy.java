package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.enums.SLAEscalationLevel;

/** Maps elapsed/deadline ratio to an {@link SLAEscalationLevel} bucket (NORMAL…BREACH). */
public interface SLAEscalationPolicy {
    SLAEscalationLevel evaluate(long elapsed, long deadline);
}
