package com.itsm.ticket.users;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Registers {@link KnownAgentTracker} only on {@code /api/*} so it doesn't intercept actuator or static paths. */
@Configuration
public class UsersFilterConfig {

    @Bean
    public FilterRegistrationBean<KnownAgentTracker> knownAgentTrackerFilter(KnownAgentService service) {
        FilterRegistrationBean<KnownAgentTracker> reg =
                new FilterRegistrationBean<>(new KnownAgentTracker(service));
        reg.addUrlPatterns("/api/*");
        reg.setName("knownAgentTrackerFilter");
        reg.setOrder(Integer.MAX_VALUE - 10);
        return reg;
    }
}
