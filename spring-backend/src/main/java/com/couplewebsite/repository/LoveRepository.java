package com.couplewebsite.repository;

import com.couplewebsite.entity.Love;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoveRepository extends JpaRepository<Love, Long> {
    
    /**
     * Find love counter by user
     */
    Optional<Love> findByUser(User user);
    
    /**
     * Find love counter by user ID
     */
    @Query("SELECT l FROM Love l WHERE l.user.id = :userId")
    Optional<Love> findByUserId(@Param("userId") Long userId);
    
    /**
     * Get total love count across all users
     */
    @Query("SELECT COALESCE(SUM(l.countValue), 0) FROM Love l")
    Long getTotalLoveCount();
    
    /**
     * Get love count for a specific user
     */
    @Query("SELECT COALESCE(l.countValue, 0) FROM Love l WHERE l.user.id = :userId")
    Long getLoveCountByUserId(@Param("userId") Long userId);
    
    /**
     * Check if user has love counter
     */
    boolean existsByUser(User user);
    
    /**
     * Check if user has love counter by user ID
     */
    @Query("SELECT COUNT(l) > 0 FROM Love l WHERE l.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);
}
