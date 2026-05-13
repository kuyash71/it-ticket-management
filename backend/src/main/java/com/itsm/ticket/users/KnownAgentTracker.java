package com.itsm.ticket.users;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Records every authenticated AGENT/MANAGER user so managers can pick from a list
 * of real agents when reassigning a ticket.
 */
@Component
public class KnownAgentTracker extends OncePerRequestFilter {

    private static final Set<String> TRACKED_ROLES = Set.of("AGENT", "MANAGER");

    private final KnownAgentService service;

    public KnownAgentTracker(KnownAgentService service) {
        this.service = service;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                upsert(jwtAuth);
            }
        } catch (Exception e) {
            // Tracking must never break the request — log and continue.
            logger.warn("KnownAgent upsert failed: " + e.getMessage());
        }
        chain.doFilter(request, response);
    }

    private void upsert(JwtAuthenticationToken jwtAuth) {
        Jwt jwt = jwtAuth.getToken();
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwtAuth.getName();
        }
        if (username == null || username.isBlank()) return;

        String role = resolveRole(jwtAuth);
        if (!TRACKED_ROLES.contains(role)) return;

        String displayName = jwt.getClaimAsString("name");
        if (displayName == null || displayName.isBlank()) {
            displayName = username;
        }

        service.upsert(username, displayName, role);
    }

    private String resolveRole(JwtAuthenticationToken jwtAuth) {
        boolean isManager = jwtAuth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()));
        if (isManager) return "MANAGER";
        boolean isAgent = jwtAuth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_AGENT".equals(a.getAuthority()));
        if (isAgent) return "AGENT";
        return "OTHER";
    }
}
