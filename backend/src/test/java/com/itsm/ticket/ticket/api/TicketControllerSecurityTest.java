package com.itsm.ticket.ticket.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itsm.ticket.ticket.domain.TicketEvent;
import com.itsm.ticket.ticket.domain.enums.TicketEventType;
import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.domain.enums.TicketType;
import com.itsm.ticket.ticket.service.TicketService;
import com.itsm.ticket.users.KnownAgentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import com.itsm.ticket.ticket.exception.UnauthorizedOperationException;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TicketController.class)
class TicketControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TicketService ticketService;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private KnownAgentService knownAgentService;

    private TicketEvent stubEvent;

    @BeforeEach
    void setUp() {
        stubEvent = mock(TicketEvent.class);
        when(stubEvent.getId()).thenReturn(UUID.randomUUID());
        when(stubEvent.getEventType()).thenReturn(TicketEventType.WORKLOG);
        when(stubEvent.getVisibility()).thenReturn(TicketEventVisibility.INTERNAL);
        when(stubEvent.getActorId()).thenReturn("agent-1");
        when(stubEvent.getOccurredAt()).thenReturn(Instant.now());
    }

    // --- Unauthenticated → 401 ---

    @Test
    void listTickets_noAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createTicket_noAuth_shouldReturn4xx() throws Exception {
        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateTicketRequest(TicketType.INCIDENT, "Title", "Desc", null, null))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void addWorklog_noAuth_shouldReturn4xx() throws Exception {
        mockMvc.perform(post("/api/v1/tickets/{id}/worklogs", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new AddWorklogRequest("did some work", TicketEventVisibility.INTERNAL))))
                .andExpect(status().is4xxClientError());
    }

    // --- Role: CUSTOMER ---

    @Test
    void listTickets_asCustomer_shouldReturn200() throws Exception {
        when(ticketService.list(any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tickets")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isOk());
    }

    @Test
    void addWorklog_asCustomer_shouldReturn403() throws Exception {
        when(ticketService.addWorklog(any(), any(), any(), eq(true)))
                .thenThrow(new UnauthorizedOperationException("Only agents and managers can add worklogs"));

        mockMvc.perform(post("/api/v1/tickets/{id}/worklogs", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new AddWorklogRequest("some work", TicketEventVisibility.INTERNAL)))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getTimeline_asCustomer_shouldReturn200() throws Exception {
        when(ticketService.getTimeline(any(), anyBoolean(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tickets/{id}/timeline", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isOk());
    }

    // --- Role: AGENT ---

    @Test
    void listTickets_asAgent_shouldReturn200() throws Exception {
        when(ticketService.list(any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tickets")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AGENT"))))
                .andExpect(status().isOk());
    }

    @Test
    void addWorklog_asAgent_shouldReturn201() throws Exception {
        when(ticketService.addWorklog(any(), any(), any(), eq(false))).thenReturn(stubEvent);

        mockMvc.perform(post("/api/v1/tickets/{id}/worklogs", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new AddWorklogRequest("Investigated logs", TicketEventVisibility.INTERNAL)))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AGENT"))))
                .andExpect(status().isCreated());
    }

    @Test
    void getTimeline_asAgent_shouldReturn200() throws Exception {
        when(ticketService.getTimeline(any(), anyBoolean(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/tickets/{id}/timeline", UUID.randomUUID())
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AGENT"))))
                .andExpect(status().isOk());
    }

    // --- Role: MANAGER ---

    @Test
    void addWorklog_asManager_shouldReturn201() throws Exception {
        when(ticketService.addWorklog(any(), any(), any(), eq(false))).thenReturn(stubEvent);

        mockMvc.perform(post("/api/v1/tickets/{id}/worklogs", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new AddWorklogRequest("Reviewed escalation", TicketEventVisibility.INTERNAL)))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_MANAGER"))))
                .andExpect(status().isCreated());
    }
}
