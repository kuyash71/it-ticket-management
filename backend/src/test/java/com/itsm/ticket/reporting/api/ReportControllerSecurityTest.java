package com.itsm.ticket.reporting.api;

import com.itsm.ticket.reporting.service.ReportService;
import com.itsm.ticket.ticket.exception.UnauthorizedOperationException;
import com.itsm.ticket.users.KnownAgentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
class ReportControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private KnownAgentService knownAgentService;

    private static final SummaryReport STUB_REPORT = new SummaryReport(
            3L, 5L, Map.of("NEW", 2L, "IN_PROGRESS", 1L), Map.of("INCIDENT", 3L),
            2L, 0L, 0.0, 1.5
    );

    // --- Unauthenticated → 401 ---

    @Test
    void summary_noAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/summary"))
                .andExpect(status().isUnauthorized());
    }

    // --- CUSTOMER → 403 (controller-level guard throws UnauthorizedOperationException) ---

    @Test
    void summary_asCustomer_shouldReturn403() throws Exception {
        when(reportService.summary()).thenReturn(STUB_REPORT);

        mockMvc.perform(get("/api/v1/reports/summary")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isForbidden());
    }

    // --- AGENT → 200 ---

    @Test
    void summary_asAgent_shouldReturn200() throws Exception {
        when(reportService.summary()).thenReturn(STUB_REPORT);

        mockMvc.perform(get("/api/v1/reports/summary")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AGENT"))))
                .andExpect(status().isOk());
    }

    // --- MANAGER → 200 ---

    @Test
    void summary_asManager_shouldReturn200() throws Exception {
        when(reportService.summary()).thenReturn(STUB_REPORT);

        mockMvc.perform(get("/api/v1/reports/summary")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_MANAGER"))))
                .andExpect(status().isOk());
    }
}
