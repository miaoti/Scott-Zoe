package com.couplewebsite.service;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelPrize;
import com.couplewebsite.repository.WheelPrizeRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WheelPrizeService {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelPrizeService.class);
    
    @Autowired
    private WheelPrizeRepository wheelPrizeRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Record a wheel prize for the current user
     */
    public WheelPrize recordPrize(String prizeType, Integer prizeValue, String prizeDescription) {
        try {
            logger.info("Starting prize recording process...");
            
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.info("Current authenticated username: {}", currentUsername);
            
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            logger.info("Found user: {} with ID: {}", currentUser.getUsername(), currentUser.getId());
            
            WheelPrize wheelPrize = new WheelPrize(currentUser, prizeType, prizeValue, prizeDescription);
            logger.info("Created WheelPrize object: {}", wheelPrize);
            
            WheelPrize savedPrize = wheelPrizeRepository.save(wheelPrize);
            logger.info("Successfully saved prize with ID: {} for user: {}", savedPrize.getId(), currentUsername);
            
            logger.info("Wheel prize recorded for user: {} - Type: {}, Value: {}", 
                       currentUsername, prizeType, prizeValue);
            
            return savedPrize;
            
        } catch (Exception e) {
            logger.error("Error recording wheel prize for user. Exception type: {}, Message: {}", 
                        e.getClass().getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Failed to record wheel prize: " + e.getMessage());
        }
    }
    
    /**
     * Get all wheel prizes for the current user
     */
    public List<WheelPrize> getCurrentUserPrizes() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            return wheelPrizeRepository.findByUserOrderByWonAtDesc(currentUser);
            
        } catch (Exception e) {
            logger.error("Error getting current user wheel prizes", e);
            throw new RuntimeException("Failed to get wheel prizes: " + e.getMessage());
        }
    }
    
    /**
     * Get total count of prizes won by current user
     */
    public long getCurrentUserPrizeCount() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            return wheelPrizeRepository.countByUser(currentUser);
            
        } catch (Exception e) {
            logger.error("Error getting current user prize count", e);
            return 0L;
        }
    }
    
    /**
     * Get total value of all prizes won by current user
     */
    public Long getCurrentUserTotalPrizeValue() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            return wheelPrizeRepository.getTotalPrizeValueByUser(currentUser);
            
        } catch (Exception e) {
            logger.error("Error getting current user total prize value", e);
            return 0L;
        }
    }
    
    /**
     * Get total value of all prizes won by specific user
     */
    public Long getTotalPrizeValueByUser(User user) {
        try {
            return wheelPrizeRepository.getTotalPrizeValueByUser(user);
        } catch (Exception e) {
            logger.error("Error getting total prize value for user: {}", user.getUsername(), e);
            return 0L;
        }
    }
    
    /**
     * Get prizes by type for current user
     */
    public List<WheelPrize> getCurrentUserPrizesByType(String prizeType) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            return wheelPrizeRepository.findByUserAndPrizeTypeOrderByWonAtDesc(currentUser, prizeType);
            
        } catch (Exception e) {
            logger.error("Error getting current user prizes by type: {}", prizeType, e);
            throw new RuntimeException("Failed to get wheel prizes by type: " + e.getMessage());
        }
    }
}