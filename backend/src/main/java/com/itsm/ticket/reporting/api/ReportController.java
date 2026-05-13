package com.itsm.ticket.reporting.api;

import com.itsm.ticket.reporting.service.ReportService;
import com.itsm.ticket.ticket.exception.UnauthorizedOperationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('AGENT', 'MANAGER')")
    public SummaryReport summary(Authentication auth) {
        if (isCustomer(auth)) {
            throw new UnauthorizedOperationException("Reports are only accessible to agents and managers");
        }
        return reportService.summary();
    }

    private boolean isCustomer(Authentication auth) {
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return !authorities.contains("ROLE_MANAGER") && !authorities.contains("ROLE_AGENT");
    }
}
