package com.couplewebsite.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.couplewebsite.repository")
@EnableJpaAuditing
@EnableTransactionManagement
public class JpaConfig {
    // This configuration class ensures proper JPA setup
    // All configuration is handled by Spring Boot auto-configuration
    // and application.yml properties
}