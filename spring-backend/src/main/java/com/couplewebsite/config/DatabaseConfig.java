package com.couplewebsite.config;

import com.couplewebsite.entity.Settings;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.SettingsRepository;
import com.couplewebsite.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
public class DatabaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SettingsRepository settingsRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Initialize default data when the application starts
     */
    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            try {
                initializeDefaultUsers();
                initializeDefaultSettings();
                logger.info("✅ Database initialization completed successfully");
            } catch (Exception e) {
                logger.error("❌ Failed to initialize database", e);
                throw e;
            }
        };
    }
    
    private void initializeDefaultUsers() {
        long userCount = userRepository.count();
        if (userCount == 0) {
            logger.info("Creating default users...");
            
            String hashedPassword = passwordEncoder.encode("mmqqforever");
            LocalDate relationshipStartDate = LocalDate.of(2023, 1, 1);
            
            User scott = new User("scott", hashedPassword, "Scott", relationshipStartDate);
            User zoe = new User("zoe", hashedPassword, "Zoe", relationshipStartDate);
            
            userRepository.save(scott);
            userRepository.save(zoe);
            
            logger.info("✅ Default users created successfully");
        } else {
            logger.info("Users already exist, skipping user creation");
        }
    }
    
    private void initializeDefaultSettings() {
        if (!settingsRepository.existsByKey("relationshipStartDate")) {
            logger.info("Creating default settings...");
            
            Settings relationshipStartSetting = new Settings("relationshipStartDate", "2023-01-01");
            settingsRepository.save(relationshipStartSetting);
            
            logger.info("✅ Default settings created successfully");
        } else {
            logger.info("Settings already exist, skipping settings creation");
        }
    }
}
