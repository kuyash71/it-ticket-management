package com.itsm.ticket.reporting.service;

import com.itsm.ticket.reporting.api.SummaryReport;
import com.itsm.ticket.reporting.repository.ReportRepository;
import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

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
