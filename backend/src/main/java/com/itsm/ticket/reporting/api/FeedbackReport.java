package com.itsm.ticket.reporting.api;

import java.util.List;
import java.util.Map;

/**
 * Doc §4.4.6 — Aggregate customer feedback metrics for the manager dashboard.
 */
public record FeedbackReport(
        long totalFeedback,
        double averageRating,
        Map<Integer, Long> ratingDistribution,
        List<AgentStat> perAgent
) {
    public record AgentStat(String agentId, long count, double averageRating) {}
}
