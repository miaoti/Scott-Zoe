package com.couplewebsite.service;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelUsage;
import com.couplewebsite.repository.WheelUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WheelUsageService {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelUsageService.class);
    
    @Autowired
    private WheelUsageRepository wheelUsageRepository;
    
    /**
     * Get the start of the current week (Sunday at 00:00:00)
     */
    public LocalDateTime getCurrentWeekStart() {
        return LocalDateTime.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY))
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
    }
    
    /**
     * Check if user has used wheel this week
     */
    public boolean hasUsedWheelThisWeek(User user) {
        LocalDateTime weekStart = getCurrentWeekStart();
        return wheelUsageRepository.hasUsedWheelInWeek(user, weekStart);
    }
    
    /**
     * Get wheel usage for current week
     */
    public Optional<WheelUsage> getWheelUsageThisWeek(User user) {
        LocalDateTime weekStart = getCurrentWeekStart();
        return wheelUsageRepository.findByUserAndWeek(user, weekStart);
    }
    
    /**
     * Record wheel usage
     */
    public WheelUsage recordWheelUsage(User user, Integer prizeAmount, String source) {
        LocalDateTime weekStart = getCurrentWeekStart();
        
        // Check if already used this week
        Optional<WheelUsage> existingUsage = wheelUsageRepository.findByUserAndWeek(user, weekStart);
        if (existingUsage.isPresent()) {
            logger.warn("User {} already used wheel this week starting {}", user.getUsername(), weekStart);
            return existingUsage.get();
        }
        
        // Create new wheel usage record
        WheelUsage wheelUsage = new WheelUsage(user, weekStart, prizeAmount, source);
        WheelUsage savedUsage = wheelUsageRepository.save(wheelUsage);
        
        logger.info("Recorded wheel usage for user {} - Prize: {}, Source: {}", 
                user.getUsername(), prizeAmount, source);
        
        return savedUsage;
    }
    
    /**
     * Get all wheel usage history for user
     */
    public List<WheelUsage> getWheelUsageHistory(User user) {
        return wheelUsageRepository.findByUserOrderByUsedAtDesc(user);
    }
    
    /**
     * Get total prizes won by user
     */
    public Integer getTotalPrizesWon(User user) {
        return wheelUsageRepository.getTotalPrizesWonByUser(user);
    }
    
    /**
     * Get wheel usage count for user
     */
    public Long getWheelUsageCount(User user) {
        return wheelUsageRepository.getWheelUsageCountByUser(user);
    }
    
    /**
     * Check if user can use wheel (hasn't used this week)
     */
    public boolean canUseWheel(User user) {
        return !hasUsedWheelThisWeek(user);
    }
    
    /**
     * Get wheel usage stats for user
     */
    public WheelUsageStats getWheelUsageStats(User user) {
        boolean canUse = canUseWheel(user);
        Optional<WheelUsage> thisWeekUsage = getWheelUsageThisWeek(user);
        Integer totalPrizes = getTotalPrizesWon(user);
        Long totalUsages = getWheelUsageCount(user);
        LocalDateTime weekStart = getCurrentWeekStart();
        
        return new WheelUsageStats(
                canUse,
                thisWeekUsage.orElse(null),
                totalPrizes,
                totalUsages,
                weekStart
        );
    }
    
    /**
     * Stats class for wheel usage information
     */
    public static class WheelUsageStats {
        private final boolean canUseThisWeek;
        private final WheelUsage thisWeekUsage;
        private final Integer totalPrizesWon;
        private final Long totalUsages;
        private final LocalDateTime currentWeekStart;
        
        public WheelUsageStats(boolean canUseThisWeek, WheelUsage thisWeekUsage, 
                              Integer totalPrizesWon, Long totalUsages, LocalDateTime currentWeekStart) {
            this.canUseThisWeek = canUseThisWeek;
            this.thisWeekUsage = thisWeekUsage;
            this.totalPrizesWon = totalPrizesWon;
            this.totalUsages = totalUsages;
            this.currentWeekStart = currentWeekStart;
        }
        
        // Getters
        public boolean canUseThisWeek() { return canUseThisWeek; }
        public WheelUsage getThisWeekUsage() { return thisWeekUsage; }
        public Integer getTotalPrizesWon() { return totalPrizesWon; }
        public Long getTotalUsages() { return totalUsages; }
        public LocalDateTime getCurrentWeekStart() { return currentWeekStart; }
    }
}
