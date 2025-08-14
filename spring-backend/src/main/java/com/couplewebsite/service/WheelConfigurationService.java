package com.couplewebsite.service;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelConfiguration;
import com.couplewebsite.entity.WheelPrizeTemplate;
import com.couplewebsite.repository.WheelConfigurationRepository;
import com.couplewebsite.repository.WheelPrizeTemplateRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WheelConfigurationService {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelConfigurationService.class);
    
    @Autowired
    private WheelConfigurationRepository wheelConfigurationRepository;
    
    @Autowired
    private WheelPrizeTemplateRepository wheelPrizeTemplateRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Get the active wheel configuration for a user
     */
    public Optional<WheelConfiguration> getActiveWheelConfiguration(User ownerUser) {
        return wheelConfigurationRepository.findByOwnerUserAndIsActiveTrue(ownerUser);
    }
    
    /**
     * Get the active wheel configuration for the current user
     */
    public Optional<WheelConfiguration> getCurrentUserActiveWheelConfiguration() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userDetailsService.getUserByUsername(currentUsername);
        return getActiveWheelConfiguration(currentUser);
    }
    
    /**
     * Get the active wheel configuration for a user by user ID
     */
    public Optional<WheelConfiguration> getWheelConfigurationByUserId(Long userId) {
        return wheelConfigurationRepository.findByOwnerUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Get user by ID
     */
    public User getUserById(Long userId) {
        return userDetailsService.getUserById(userId);
    }
    
    /**
     * Get the active wheel configuration for another user (for cross-user configuration)
     */
    public Optional<WheelConfiguration> getOtherUserActiveWheelConfiguration() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userDetailsService.getUserByUsername(currentUsername);
        
        // Find the other user (Scott or Zoe)
        String otherUsername = currentUsername.equals("scott") ? "zoe" : "scott";
        User otherUser = userDetailsService.getUserByUsername(otherUsername);
        
        return getActiveWheelConfiguration(otherUser);
    }
    
    /**
     * Create or update wheel configuration
     */
    public WheelConfiguration saveWheelConfiguration(User ownerUser, List<WheelPrizeTemplate> prizeTemplates) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User configuredByUser = userDetailsService.getUserByUsername(currentUsername);
        
        // Validate that probabilities sum to 100%
        BigDecimal totalProbability = prizeTemplates.stream()
                .map(WheelPrizeTemplate::getProbability)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalProbability.compareTo(new BigDecimal("100.00")) != 0) {
            throw new IllegalArgumentException("Total probability must equal 100%. Current total: " + totalProbability);
        }
        
        // Deactivate existing configurations for this owner
        wheelConfigurationRepository.deactivateAllForOwnerUser(ownerUser);
        
        // Create new configuration
        WheelConfiguration wheelConfiguration = new WheelConfiguration(ownerUser, configuredByUser);
        WheelConfiguration savedConfiguration = wheelConfigurationRepository.save(wheelConfiguration);
        
        // Save prize templates
        for (int i = 0; i < prizeTemplates.size(); i++) {
            WheelPrizeTemplate template = prizeTemplates.get(i);
            template.setWheelConfiguration(savedConfiguration);
            template.setDisplayOrder(i + 1);
            wheelPrizeTemplateRepository.save(template);
        }
        
        logger.info("Wheel configuration saved for owner: {} by configurator: {} with {} prizes", 
                   ownerUser.getUsername(), configuredByUser.getUsername(), prizeTemplates.size());
        
        return savedConfiguration;
    }
    
    /**
     * Get all prize templates for a wheel configuration
     */
    public List<WheelPrizeTemplate> getPrizeTemplates(WheelConfiguration wheelConfiguration) {
        return wheelPrizeTemplateRepository.findByWheelConfigurationOrderByDisplayOrder(wheelConfiguration);
    }
    
    /**
     * Get wheel configurations where current user is involved (as owner or configurator)
     */
    public List<WheelConfiguration> getCurrentUserWheelConfigurations() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userDetailsService.getUserByUsername(currentUsername);
        return wheelConfigurationRepository.findByOwnerUserOrConfiguredByUserOrderByUpdatedAtDesc(currentUser);
    }
    
    /**
     * Check if current user can configure wheel for another user
     */
    public boolean canConfigureWheelForOtherUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return currentUsername.equals("scott") || currentUsername.equals("zoe");
    }
    
    /**
     * Get the other user (Scott gets Zoe, Zoe gets Scott)
     */
    public User getOtherUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String otherUsername = currentUsername.equals("scott") ? "zoe" : "scott";
        return userDetailsService.getUserByUsername(otherUsername);
    }
    
    /**
     * Create default wheel configuration for a user if none exists
     */
    public WheelConfiguration createDefaultWheelConfiguration(User ownerUser) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User configuredByUser = userDetailsService.getUserByUsername(currentUsername);
        
        // Create default configuration
        WheelConfiguration wheelConfiguration = new WheelConfiguration(ownerUser, configuredByUser);
        WheelConfiguration savedConfiguration = wheelConfigurationRepository.save(wheelConfiguration);
        
        // Create default prize templates (similar to current static wheel)
        String[] colors = {"#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280", "#4B5563", "#374151", "#1F2937"};
        int[] amounts = {1, 5, 10, 25, 77, 100, 500, 1000};
        BigDecimal[] probabilities = {
            new BigDecimal("45.00"), new BigDecimal("25.00"), new BigDecimal("15.00"), new BigDecimal("10.00"),
            new BigDecimal("2.50"), new BigDecimal("1.50"), new BigDecimal("0.50"), new BigDecimal("0.50")
        };
        
        for (int i = 0; i < amounts.length; i++) {
            WheelPrizeTemplate template = new WheelPrizeTemplate(
                savedConfiguration,
                "$" + amounts[i],
                "Win $" + amounts[i] + " love points",
                "MONEY",
                amounts[i],
                probabilities[i],
                colors[i],
                i + 1
            );
            wheelPrizeTemplateRepository.save(template);
        }
        
        logger.info("Default wheel configuration created for owner: {} by configurator: {}", 
                   ownerUser.getUsername(), configuredByUser.getUsername());
        
        return savedConfiguration;
    }
}