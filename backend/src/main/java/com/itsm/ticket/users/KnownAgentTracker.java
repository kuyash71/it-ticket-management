package com.itsm.ticket.users;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Authenticated kullanıcıları kaydeder; manager reassign listesi ve reminder mail lookup için.
 * /api/* path'lerine bind, kullanıcı başına {@link #THROTTLE_WINDOW} boyunca tek DB yazımı.
 */
public class KnownAgentTracker extends OncePerRequestFilter {

    private static final Set<String> TRACKED_ROLES = Set.of("AGENT", "MANAGER", "CUSTOMER");
    private static final Duration THROTTLE_WINDOW = Duration.ofMinutes(5);

    private final KnownAgentService service;
    private final ConcurrentMap<String, Instant> lastSeen = new ConcurrentHashMap<>();

    public KnownAgentTracker(KnownAgentService service) {
        this.service = service;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwtAuth && auth.isAuthenticated()) {
                upsertIfNeeded(jwtAuth);
            }
        } catch (Exception e) {
            logger.warn("KnownAgent upsert failed: " + e.getMessage());
        }
        chain.doFilter(request, response);
    }

    private void upsertIfNeeded(JwtAuthenticationToken jwtAuth) {
        Jwt jwt = jwtAuth.getToken();
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwtAuth.getName();
        }
        if (username == null || username.isBlank()) return;

        String role = resolveRole(jwtAuth);
        if (!TRACKED_ROLES.contains(role)) return;

        Instant now = Instant.now();
        Instant prev = lastSeen.get(username);
        if (prev != null && Duration.between(prev, now).compareTo(THROTTLE_WINDOW) < 0) {
            return;
        }

        String displayName = jwt.getClaimAsString("name");
        if (displayName == null || displayName.isBlank()) {
            displayName = username;
        }
        String email = jwt.getClaimAsString("email");

        service.upsert(username, displayName, role, email);
        lastSeen.put(username, now);
    }

    private String resolveRole(JwtAuthenticationToken jwtAuth) {
        boolean isManager = jwtAuth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()));
        if (isManager) return "MANAGER";
        boolean isAgent = jwtAuth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_AGENT".equals(a.getAuthority()));
        if (isAgent) return "AGENT";
        boolean isCustomer = jwtAuth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CUSTOMER".equals(a.getAuthority()));
        if (isCustomer) return "CUSTOMER";
        return "OTHER";
    }
}
