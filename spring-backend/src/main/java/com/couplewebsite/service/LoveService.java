package com.couplewebsite.service;

import com.couplewebsite.entity.Love;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.LoveRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class LoveService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoveService.class);
    
    @Autowired
    private LoveRepository loveRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Get shared love count (always uses Zoe's count)
     */
    public Long getCurrentUserLoveCount() {
        try {
            // Always use Zoe's love count for shared experience
            User zoeUser = userDetailsService.getUserByUsername("zoe");
            
            Optional<Love> loveOpt = loveRepository.findByUser(zoeUser);
            return loveOpt.map(Love::getCountValue).orElse(0L);
            
        } catch (Exception e) {
            logger.error("Error getting shared love count", e);
            return 0L;
        }
    }
    
    /**
     * Get total love count across all users
     */
    public Long getTotalLoveCount() {
        try {
            return loveRepository.getTotalLoveCount();
        } catch (Exception e) {
            logger.error("Error getting total love count", e);
            return 0L;
        }
    }
    
    /**
     * Increment shared love count (always uses Zoe's count)
     */
    public Love incrementLoveCount() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            // Always use Zoe's love count for shared experience
            User zoeUser = userDetailsService.getUserByUsername("zoe");
            
            Optional<Love> loveOpt = loveRepository.findByUser(zoeUser);
            
            Love love;
            if (loveOpt.isPresent()) {
                love = loveOpt.get();
                love.incrementCount();
            } else {
                love = new Love(zoeUser, 1L);
            }
            
            Love savedLove = loveRepository.save(love);
            logger.info("Shared love count incremented by user: {} to {}", currentUsername, savedLove.getCountValue());
            
            return savedLove;
            
        } catch (Exception e) {
            logger.error("Error incrementing shared love count", e);
            throw new RuntimeException("Failed to increment love count: " + e.getMessage());
        }
    }
    
    /**
     * Set shared love count to a specific value (always uses Zoe's count)
     */
    public Love setLoveCount(Long count) {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            // Always use Zoe's love count for shared experience
            User zoeUser = userDetailsService.getUserByUsername("zoe");
            
            Optional<Love> loveOpt = loveRepository.findByUser(zoeUser);
            
            Love love;
            if (loveOpt.isPresent()) {
                love = loveOpt.get();
                love.setCountValue(count);
            } else {
                love = new Love(zoeUser, count);
            }
            
            Love savedLove = loveRepository.save(love);
            logger.info("Shared love count set by user: {} to {}", currentUsername, savedLove.getCountValue());
            
            return savedLove;
            
        } catch (Exception e) {
            logger.error("Error setting shared love count", e);
            throw new RuntimeException("Failed to set love count: " + e.getMessage());
        }
    }
    
    /**
     * Get love statistics
     */
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
