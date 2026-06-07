package com.itsm.ticket.reporting.api;

import java.util.List;
import java.util.Map;

/**
 * Doc §12 Reporting — Agent iş yükü. Manager dashboard'unda ekip dengesini görmek için.
 *
 * <p>{@code byStatus} her status için açık ticket sayısını içerir (CLOSED hariç).
 * {@code total} bu agent'a atanmış toplam açık ticket sayısıdır.
 */
public record AgentWorkloadReport(
        List<AgentWorkload> agents
) {
    public record AgentWorkload(
            String agentId,
            long total,
            Map<String, Long> byStatus
    ) {}
}
