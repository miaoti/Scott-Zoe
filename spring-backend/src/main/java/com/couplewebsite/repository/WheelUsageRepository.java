package com.couplewebsite.repository;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WheelUsageRepository extends JpaRepository<WheelUsage, Long> {
    
    /**
     * Find wheel usage by user and week start
     */
    Optional<WheelUsage> findByUserAndWeekStart(User user, LocalDateTime weekStart);
    
    /**
     * Check if user has used wheel in a specific week
     */
    @Query("SELECT COUNT(w) > 0 FROM WheelUsage w WHERE w.user = :user AND w.weekStart = :weekStart")
    boolean hasUsedWheelInWeek(@Param("user") User user, @Param("weekStart") LocalDateTime weekStart);
    
    /**
     * Get all wheel usage for a user ordered by most recent
     */
    List<WheelUsage> findByUserOrderByUsedAtDesc(User user);
    
    /**
     * Get wheel usage for a user in a specific week
     */
    @Query("SELECT w FROM WheelUsage w WHERE w.user = :user AND w.weekStart = :weekStart")
    Optional<WheelUsage> findByUserAndWeek(@Param("user") User user, @Param("weekStart") LocalDateTime weekStart);
    
    /**
     * Get total prize amount won by user
     */
    @Query("SELECT COALESCE(SUM(w.prizeAmount), 0) FROM WheelUsage w WHERE w.user = :user")
    Integer getTotalPrizesWonByUser(@Param("user") User user);
    
    /**
     * Get wheel usage count for user
     */
    @Query("SELECT COUNT(w) FROM WheelUsage w WHERE w.user = :user")
    Long getWheelUsageCountByUser(@Param("user") User user);
}
