package com.couplewebsite.repository;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelPrize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WheelPrizeRepository extends JpaRepository<WheelPrize, Long> {
    
    /**
     * Find all wheel prizes for a specific user, ordered by won date descending
     */
    List<WheelPrize> findByUserOrderByWonAtDesc(User user);
    
    /**
     * Find all wheel prizes for a specific user ID, ordered by won date descending
     */
    List<WheelPrize> findByUserIdOrderByWonAtDesc(Long userId);
    
    /**
     * Count total prizes won by a user
     */
    long countByUser(User user);
    
    /**
     * Count total prizes won by user ID
     */
    long countByUserId(Long userId);
    
    /**
     * Get total value of all prizes won by a user
     */
    @Query("SELECT COALESCE(SUM(wp.prizeValue), 0) FROM WheelPrize wp WHERE wp.user = :user")
    Long getTotalPrizeValueByUser(@Param("user") User user);
    
    /**
     * Get total value of all prizes won by user ID
     */
    @Query("SELECT COALESCE(SUM(wp.prizeValue), 0) FROM WheelPrize wp WHERE wp.user.id = :userId")
    Long getTotalPrizeValueByUserId(@Param("userId") Long userId);
    
    /**
     * Find prizes by type for a specific user
     */
    List<WheelPrize> findByUserAndPrizeTypeOrderByWonAtDesc(User user, String prizeType);
}