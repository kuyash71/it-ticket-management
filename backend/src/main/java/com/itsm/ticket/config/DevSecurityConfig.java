package com.itsm.ticket.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/** Dev-only: SPRING_PROFILES_ACTIVE=dev iken Keycloak/JWT yerine fake user inject edilir. */
@Configuration
@EnableMethodSecurity
@Profile("dev")
public class DevSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(DevSecurityConfig.class);

    @Value("${itsm.auth.fake-user:manager1}")
    private String fakeUser;

    @Value("${itsm.auth.fake-roles:MANAGER}")
    private String fakeRoles;

    @Value("${itsm.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String corsOrigins;

    @PostConstruct
    void warn() {
        log.warn("╔══════════════════════════════════════════════════════════════════╗");
        log.warn("║  ⚠  DEV AUTH BYPASS ACTIVE — DO NOT USE IN PRODUCTION  ⚠         ║");
        log.warn("║  Fake user:  {}                                              ", fakeUser);
        log.warn("║  Fake roles: {}                                              ", fakeRoles);
        log.warn("║  Keycloak/JWT validation is DISABLED.                            ║");
        log.warn("╚══════════════════════════════════════════════════════════════════╝");
    }

    @Bean
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/prometheus",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/tickets/*/worklogs")
                            .hasAnyRole("AGENT", "MANAGER")
                        .requestMatchers("/api/v1/tickets/**")
                            .hasAnyRole("AGENT", "MANAGER", "CUSTOMER")
                        .requestMatchers("/api/v1/users/**").hasAnyRole("AGENT", "MANAGER")
                        .requestMatchers("/api/v1/reports/**").hasAnyRole("AGENT", "MANAGER")
                        .anyRequest().authenticated())
                .addFilterBefore(new DevAuthFilter(fakeUser, fakeRoles), AuthorizationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Accept", "Accept-Language",
                "X-Requested-With", "Content-Disposition"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
