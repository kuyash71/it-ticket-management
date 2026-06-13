package com.itsm.ticket.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Dev-only: her isteğe sabit bir fake kullanıcıyı JwtAuthenticationToken olarak inject eder. */
public class DevAuthFilter extends OncePerRequestFilter {

    private final String fakeUser;
    private final List<String> fakeRoles;

    public DevAuthFilter(String fakeUser, String fakeRolesCsv) {
        this.fakeUser = fakeUser;
        this.fakeRoles = Arrays.stream(fakeRolesCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toUpperCase(Locale.ROOT))
                .toList();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            List<GrantedAuthority> authorities = new ArrayList<>();
            for (String role : fakeRoles) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
            Jwt fakeJwt = Jwt.withTokenValue("dev-bypass-token")
                    .header("alg", "none")
                    .header("typ", "JWT")
                    .subject(fakeUser)
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .claim("preferred_username", fakeUser)
                    .claim("name", fakeUser)
                    .claim("email", fakeUser + "@dev.local")
                    .claim("realm_access", Map.of("roles", fakeRoles))
                    .build();
            AbstractAuthenticationToken token = new JwtAuthenticationToken(fakeJwt, authorities, fakeUser);
            token.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(token);
        }
        chain.doFilter(request, response);
    }
}
