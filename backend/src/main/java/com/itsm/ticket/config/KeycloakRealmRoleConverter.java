package com.itsm.ticket.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class KeycloakRealmRoleConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        collectRoles(jwt.getClaim("realm_access"), authorities);

        Object resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess instanceof Map<?, ?> ra) {
            for (Object entry : ra.values()) {
                collectRoles(entry, authorities);
            }
        }

        String principalName = jwt.getClaimAsString("preferred_username");
        if (principalName == null || principalName.isBlank()) {
            principalName = jwt.getSubject();
        }

        return new JwtAuthenticationToken(jwt, authorities, principalName);
    }

    private static void collectRoles(Object claim, Set<GrantedAuthority> sink) {
        if (!(claim instanceof Map<?, ?> map)) return;
        Object roles = map.get("roles");
        if (!(roles instanceof List<?> list)) return;
        for (Object role : list) {
            if (role instanceof String s && !s.isBlank()) {
                sink.add(new SimpleGrantedAuthority("ROLE_" + s.toUpperCase(Locale.ROOT)));
            }
        }
    }
}
