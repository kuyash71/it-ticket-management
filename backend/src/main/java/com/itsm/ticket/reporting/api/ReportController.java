package com.itsm.ticket.reporting.api;

import com.itsm.ticket.reporting.service.ReportService;
import com.itsm.ticket.ticket.exception.UnauthorizedOperationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Aggregate reporting endpoints (Doc §12). Restricted to agent/manager; customer requests
 * are rejected with 403.
 */
@Tag(name = "Reports", description = "Ticket reporting and statistics (agent/manager only)")
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @Operation(summary = "Get aggregated ticket summary report")
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('AGENT', 'MANAGER')")
    public SummaryReport summary(Authentication auth) {
        if (isCustomer(auth)) {
            throw new UnauthorizedOperationException("Reports are only accessible to agents and managers");
        }
        return reportService.summary();
    }

    @Operation(summary = "Customer feedback report — manager only (Doc §4.4.6)")
    @GetMapping("/feedback")
    @PreAuthorize("hasRole('MANAGER')")
    public FeedbackReport feedback() {
        return reportService.feedback();
    }

    @Operation(summary = "Agent workload report — manager only (Doc §12)")
    @GetMapping("/agents/workload")
    @PreAuthorize("hasRole('MANAGER')")
    public AgentWorkloadReport agentWorkload() {
        return reportService.agentWorkload();
    }

    private boolean isCustomer(Authentication auth) {
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return !authorities.contains("ROLE_MANAGER") && !authorities.contains("ROLE_AGENT");
    }
}
