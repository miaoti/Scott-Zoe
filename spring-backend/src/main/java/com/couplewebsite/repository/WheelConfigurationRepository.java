package com.couplewebsite.repository;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WheelConfigurationRepository extends JpaRepository<WheelConfiguration, Long> {
    
    /**
     * Find the active wheel configuration for a specific owner user
     */
    Optional<WheelConfiguration> findByOwnerUserAndIsActiveTrue(User ownerUser);
    
    /**
     * Find the active wheel configuration for a specific owner user ID
     */
    @Query("SELECT wc FROM WheelConfiguration wc WHERE wc.ownerUser.id = :ownerUserId AND wc.isActive = true")
    Optional<WheelConfiguration> findByOwnerUserIdAndIsActiveTrue(@Param("ownerUserId") Long ownerUserId);
    
    /**
     * Find all wheel configurations created by a specific user
     */
    List<WheelConfiguration> findByConfiguredByUserOrderByUpdatedAtDesc(User configuredByUser);
    
    /**
     * Find all wheel configurations for a specific owner user
     */
    List<WheelConfiguration> findByOwnerUserOrderByUpdatedAtDesc(User ownerUser);
    
    /**
     * Find wheel configurations where a user is either owner or configurator
     */
    @Query("SELECT wc FROM WheelConfiguration wc WHERE wc.ownerUser = :user OR wc.configuredByUser = :user ORDER BY wc.updatedAt DESC")
    List<WheelConfiguration> findByOwnerUserOrConfiguredByUserOrderByUpdatedAtDesc(@Param("user") User user);
    
    /**
     * Check if a user has configured a wheel for another specific user
     */
    @Query("SELECT COUNT(wc) > 0 FROM WheelConfiguration wc WHERE wc.ownerUser = :ownerUser AND wc.configuredByUser = :configuredByUser AND wc.isActive = true")
    boolean existsByOwnerUserAndConfiguredByUserAndIsActiveTrue(@Param("ownerUser") User ownerUser, @Param("configuredByUser") User configuredByUser);
    
    /**
     * Deactivate all existing configurations for a user (used when creating a new active configuration)
     */
    @Query("UPDATE WheelConfiguration wc SET wc.isActive = false WHERE wc.ownerUser = :ownerUser AND wc.isActive = true")
    void deactivateAllForOwnerUser(@Param("ownerUser") User ownerUser);
}