package com.couplewebsite.repository;

import com.couplewebsite.entity.SavedOpportunity;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedOpportunityRepository extends JpaRepository<SavedOpportunity, Long> {
    
    /**
     * Find all unused opportunities for a user
     */
    List<SavedOpportunity> findByUserAndIsUsedFalseOrderByCreatedAtAsc(User user);
    
    /**
     * Count unused opportunities for a user
     */
    @Query("SELECT COUNT(so) FROM SavedOpportunity so WHERE so.user = :user AND so.isUsed = false")
    Long countUnusedOpportunitiesByUser(@Param("user") User user);
    
    /**
     * Find the oldest unused opportunity for a user
     */
    Optional<SavedOpportunity> findFirstByUserAndIsUsedFalseOrderByCreatedAtAsc(User user);
    
    /**
     * Find all opportunities for a user (used and unused)
     */
    List<SavedOpportunity> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Count total opportunities created for a user
     */
    Long countByUser(User user);
    
    /**
     * Count used opportunities for a user
     */
    @Query("SELECT COUNT(so) FROM SavedOpportunity so WHERE so.user = :user AND so.isUsed = true")
    Long countUsedOpportunitiesByUser(@Param("user") User user);
}