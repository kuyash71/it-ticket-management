package com.itsm.ticket.reporting.api;

import java.util.Map;

/** Aggregate counts and SLA metrics surfaced on the manager dashboard. */
public record SummaryReport(
        long openTickets,
        long totalTickets,
        Map<String, Long> byStatus,
        Map<String, Long> byType,
        long resolvedTotal,
        long slaBreachCount,
        double slaBreachRatePercent,
        double avgResolutionHours
) {}
