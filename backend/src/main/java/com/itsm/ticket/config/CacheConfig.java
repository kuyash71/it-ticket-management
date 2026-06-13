  package com.itsm.ticket.config;

  import org.springframework.cache.annotation.EnableCaching;
  import org.springframework.context.annotation.Configuration;

  /** Enables Spring's {@code @Cacheable} support; backing store and TTL are set in {@code application.yml}. */
  @Configuration
  @EnableCaching
  public class CacheConfig {
  }
