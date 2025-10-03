package com.couplewebsite.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Railway-specific configuration to handle DATABASE_URL parsing and profile activation
 */
@Component
public class RailwayConfig implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();
        
        // Check if we're running on Railway (Railway sets RAILWAY_ENVIRONMENT)
        String railwayEnv = environment.getProperty("RAILWAY_ENVIRONMENT");
        String databaseUrl = environment.getProperty("DATABASE_URL");
        
        if (railwayEnv != null || (databaseUrl != null && databaseUrl.startsWith("postgresql://"))) {
            Map<String, Object> railwayProps = new HashMap<>();
            
            // Force production profile on Railway
            railwayProps.put("spring.profiles.active", "production");
            
            // Parse DATABASE_URL if it exists and doesn't start with jdbc:
            if (databaseUrl != null && !databaseUrl.startsWith("jdbc:")) {
                try {
                    URI dbUri = new URI(databaseUrl);
                    String jdbcUrl = "jdbc:postgresql://" + dbUri.getHost() + ":" + dbUri.getPort() + dbUri.getPath();
                    
                    railwayProps.put("spring.datasource.url", jdbcUrl);
                    
                    if (dbUri.getUserInfo() != null) {
                        String[] userInfo = dbUri.getUserInfo().split(":");
                        if (userInfo.length >= 1) {
                            railwayProps.put("spring.datasource.username", userInfo[0]);
                        }
                        if (userInfo.length >= 2) {
                            railwayProps.put("spring.datasource.password", userInfo[1]);
                        }
                    }
                    
                    // Add SSL parameters for Railway PostgreSQL
                    if (jdbcUrl.contains("railway.app")) {
                        railwayProps.put("spring.datasource.url", jdbcUrl + "?sslmode=require");
                    }
                    
                } catch (Exception e) {
                    System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
                    // Fallback to using DATABASE_URL as-is
                    railwayProps.put("spring.datasource.url", databaseUrl);
                }
            }
            
            // Add the Railway-specific properties
            environment.getPropertySources().addFirst(
                new MapPropertySource("railwayConfig", railwayProps)
            );
            
            System.out.println("Railway configuration applied. Active profile: production");
        }
    }
}