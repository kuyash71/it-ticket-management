package com.itsm.ticket.users;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UsersFilterConfig {

    /**
     * KnownAgentTracker'ı yalnızca {@code /api/*} pattern'ına bind eder; {@code /actuator/*},
     * Swagger, statik kaynaklar tetiklemez. Düzgün auto-detect yapsa da Boot bunu
     * tüm path'lere uyguluyordu — explicit registration ile sıkıyoruz.
     */
    @Bean
    public FilterRegistrationBean<KnownAgentTracker> knownAgentTrackerFilter(KnownAgentService service) {
        FilterRegistrationBean<KnownAgentTracker> reg =
                new FilterRegistrationBean<>(new KnownAgentTracker(service));
        reg.addUrlPatterns("/api/*");
        reg.setName("knownAgentTrackerFilter");
        reg.setOrder(Integer.MAX_VALUE - 10); // security chain'den sonra çalışsın
        return reg;
    }
}
