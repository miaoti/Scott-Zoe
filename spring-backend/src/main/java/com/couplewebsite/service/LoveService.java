package com.couplewebsite.service;

import com.couplewebsite.entity.Love;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.LoveRepository;
import com.couplewebsite.repository.UserRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class LoveService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoveService.class);
    
    @Autowired
    private LoveRepository loveRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Get current user's love count (user-based)
     */
    @Transactional(readOnly = true)
    public Long getCurrentUserLoveCount() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            Optional<Love> loveOpt = loveRepository.findByUser(currentUser);
            return loveOpt.map(Love::getCountValue).orElse(0L);
            
        } catch (Exception e) {
            logger.error("Error getting current user love count", e);
            return 0L;
        }
    }
    
    /**
     * Get total love count across all users
     */
    @Transactional(readOnly = true)
    public Long getTotalLoveCount() {
        try {
            return loveRepository.getTotalLoveCount();
        } catch (Exception e) {
            logger.error("Error getting total love count", e);
            return 0L;
        }
    }
    
    /**
     * Increment current user's love count (user-based)
     */
    @Transactional
    public Love incrementLoveCount() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            Optional<Love> loveOpt = loveRepository.findByUser(currentUser);
            
            Love love;
            if (loveOpt.isPresent()) {
                love = loveOpt.get();
                love.incrementCount();
            } else {
                love = new Love(currentUser, 1L);
            }
            
            Love savedLove = loveRepository.save(love);
            logger.info("Love count incremented by user: {} to {}", currentUsername, savedLove.getCountValue());
            
            return savedLove;
            
        } catch (Exception e) {
            logger.error("Error incrementing love count", e);
            throw new RuntimeException("Failed to increment love count: " + e.getMessage());
        }
    }
    
    /**
     * Set current user's love count to a specific value (user-based)
     */
    @Transactional
    public Love setLoveCount(Long count) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userDetailsService.getUserByUsername(currentUsername);
            
            Optional<Love> loveOpt = loveRepository.findByUser(currentUser);
            
            Love love;
            if (loveOpt.isPresent()) {
                love = loveOpt.get();
                love.setCountValue(count);
            } else {
                love = new Love(currentUser, count);
            }
            
            Love savedLove = loveRepository.save(love);
            logger.info("Love count set by user: {} to {}", currentUsername, savedLove.getCountValue());
            
            return savedLove;
            
        } catch (Exception e) {
            logger.error("Error setting love count", e);
            throw new RuntimeException("Failed to set love count: " + e.getMessage());
        }
    }
    
    /**
     * Get love statistics
     */
    @Transactional(readOnly = true)
    public LoveStats getLoveStats() {
        try {
            Long currentUserCount = getCurrentUserLoveCount();
            Long totalCount = getTotalLoveCount();
            
            // Calculate next milestone (every 520)
            Long nextMilestone = ((currentUserCount / 520) + 1) * 520;
            Long remainingToMilestone = nextMilestone - currentUserCount;
            Long currentLevel = (currentUserCount / 520) + 1;
            Double progressPercent = ((double) (currentUserCount % 520) / 520.0) * 100.0;
            
            return new LoveStats(
                    currentUserCount,
                    totalCount,
                    nextMilestone,
                    remainingToMilestone,
                    currentLevel,
                    progressPercent
            );
            
        } catch (Exception e) {
            logger.error("Error getting love stats", e);
            return new LoveStats(0L, 0L, 520L, 520L, 1L, 0.0);
        }
    }
    
    /**
     * Check if current milestone reached
     */
    public boolean isMilestoneReached(Long count) {
        return count > 0 && count % 520 == 0;
    }
    
    /**
     * Get love count by username
     */
    @Transactional(readOnly = true)
    public Long getLoveCountByUsername(String username) {
        try {
            User user = userDetailsService.getUserByUsername(username);
            Optional<Love> loveOpt = loveRepository.findByUser(user);
            return loveOpt.map(Love::getCountValue).orElse(0L);
        } catch (Exception e) {
            logger.error("Error getting love count for user: " + username, e);
            return 0L;
        }
    }
    
    /**
     * Non-transactional version for SSE usage to avoid connection leaks
     * Uses direct repository access without going through transactional services
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public Long getLoveCountByUsernameNonTransactional(String username) {
        try {
            // Direct repository access to avoid transactional UserService
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                logger.warn("User not found: " + username);
                return 0L;
            }
            
            Optional<Love> loveOpt = loveRepository.findByUser(userOpt.get());
            return loveOpt.map(Love::getCountValue).orElse(0L);
        } catch (Exception e) {
            logger.error("Error getting love count for user: " + username, e);
            return 0L;
        }
    }
    
    /**
     * Non-transactional version of getCurrentUserLoveCount for SSE usage
     * Uses direct repository access without going through transactional services
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public Long getCurrentUserLoveCountNonTransactional() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            
            // Direct repository access to avoid transactional UserService
            Optional<User> userOpt = userRepository.findByUsername(currentUsername);
            if (userOpt.isEmpty()) {
                logger.warn("Current user not found: " + currentUsername);
                return 0L;
            }
            
            Optional<Love> loveOpt = loveRepository.findByUser(userOpt.get());
            return loveOpt.map(Love::getCountValue).orElse(0L);
            
        } catch (Exception e) {
            logger.error("Error getting current user love count", e);
            return 0L;
        }
    }
    
    // Inner class for love statistics
    public static class LoveStats {
        private final Long currentUserCount;
        private final Long totalCount;
        private final Long nextMilestone;
        private final Long remainingToMilestone;
        private final Long currentLevel;
        private final Double progressPercent;
        
        public LoveStats(Long currentUserCount, Long totalCount, Long nextMilestone, 
                        Long remainingToMilestone, Long currentLevel, Double progressPercent) {
            this.currentUserCount = currentUserCount;
            this.totalCount = totalCount;
            this.nextMilestone = nextMilestone;
            this.remainingToMilestone = remainingToMilestone;
            this.currentLevel = currentLevel;
            this.progressPercent = progressPercent;
        }
        
        // Getters
        public Long getCurrentUserCount() { return currentUserCount; }
        public Long getTotalCount() { return totalCount; }
        public Long getNextMilestone() { return nextMilestone; }
        public Long getRemainingToMilestone() { return remainingToMilestone; }
        public Long getCurrentLevel() { return currentLevel; }
        public Double getProgressPercent() { return progressPercent; }
    }
}
