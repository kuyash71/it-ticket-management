package com.itsm.ticket.reporting.service;

import com.itsm.ticket.reporting.api.AgentWorkloadReport;
import com.itsm.ticket.reporting.api.FeedbackReport;
import com.itsm.ticket.reporting.api.SummaryReport;
import com.itsm.ticket.reporting.repository.ReportRepository;
import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import com.itsm.ticket.ticket.repository.TicketRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregated reporting service for ticket statistics.
 *
 * <p>Results are cached under {@code "summary-report"} with the TTL configured in
 * {@code spring.cache.caffeine.spec}. The cache entry expires automatically; for immediate
 * invalidation annotate a write operation with {@code @CacheEvict(value = "summary-report",
 * allEntries = true)}.
 */
@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final TicketRepository ticketRepository;

    public ReportService(ReportRepository reportRepository, TicketRepository ticketRepository) {
        this.reportRepository = reportRepository;
        this.ticketRepository = ticketRepository;
    }

    /** Aggregate counts: status/type breakdown, open total, SLA breach rate, average resolution. */
    @Cacheable("summary-report")
    @Transactional(readOnly = true)
    public SummaryReport summary() {
        Map<String, Long> byStatus = toMap(reportRepository.countByStatus());
        Map<String, Long> byType = toMap(reportRepository.countByType());

        long openTickets = reportRepository.countOpenTickets();
        long totalTickets = byStatus.values().stream().mapToLong(Long::longValue).sum();

        long resolvedTotal = reportRepository.countBySlaClock(SLAClockState.STOPPED);
        long slaBreachCount = reportRepository.countSlaBreaches(SLAClockState.STOPPED);

        double breachRate = resolvedTotal > 0
                ? (double) slaBreachCount / resolvedTotal * 100.0
                : 0.0;

        double avgSeconds = reportRepository.avgElapsedSeconds(SLAClockState.STOPPED)
                .orElse(0.0);
        double avgHours = avgSeconds / 3600.0;

        return new SummaryReport(
                openTickets,
                totalTickets,
                byStatus,
                byType,
                resolvedTotal,
                slaBreachCount,
                Math.round(breachRate * 10.0) / 10.0,
                Math.round(avgHours * 10.0) / 10.0
        );
    }

    /**
     * Doc §4.4.6 — Feedback aggregate report. Not cached: feedback volume is low and managers
     * expect near-real-time visibility after a customer submits a rating.
     */
    @Transactional(readOnly = true)
    public FeedbackReport feedback() {
        long total = reportRepository.countFeedback();
        double avg = reportRepository.avgFeedbackRating().orElse(0.0);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        for (Object[] row : reportRepository.ratingDistribution()) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) continue;
            int rating = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            distribution.put(rating, count);
        }

        List<FeedbackReport.AgentStat> perAgent = new ArrayList<>();
        for (Object[] row : reportRepository.agentBreakdown()) {
            if (row == null || row.length < 3 || row[0] == null) continue;
            String agentId = row[0].toString();
            long count = ((Number) row[1]).longValue();
            double agentAvg = ((Number) row[2]).doubleValue();
            perAgent.add(new FeedbackReport.AgentStat(
                    agentId, count, Math.round(agentAvg * 10.0) / 10.0));
        }

        return new FeedbackReport(
                total,
                Math.round(avg * 10.0) / 10.0,
                distribution,
                perAgent
        );
    }

    /**
     * Doc §12 — Per-agent open workload (CLOSED hariç). Yüksek total değeri olanlar başta.
     */
    @Transactional(readOnly = true)
    public AgentWorkloadReport agentWorkload() {
        Map<String, Map<String, Long>> byAgent = new LinkedHashMap<>();
        for (Object[] row : ticketRepository.agentWorkloadBreakdown()) {
            if (row == null || row.length < 3 || row[0] == null) continue;
            String agentId = row[0].toString();
            String status = row[1].toString();
            long count = ((Number) row[2]).longValue();
            byAgent.computeIfAbsent(agentId, k -> new LinkedHashMap<>()).put(status, count);
        }

        List<AgentWorkloadReport.AgentWorkload> rows = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> e : byAgent.entrySet()) {
            long total = e.getValue().values().stream().mapToLong(Long::longValue).sum();
            rows.add(new AgentWorkloadReport.AgentWorkload(e.getKey(), total, e.getValue()));
        }
        rows.sort(Comparator.comparingLong(AgentWorkloadReport.AgentWorkload::total).reversed());
        return new AgentWorkloadReport(rows);
    }

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            try {
                result.put(row[0].toString(), (Long) row[1]);
            } catch (ClassCastException ex) {
                result.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }
        return result;
    }
}
