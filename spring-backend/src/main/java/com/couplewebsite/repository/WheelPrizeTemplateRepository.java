package com.couplewebsite.repository;

import com.couplewebsite.entity.WheelConfiguration;
import com.couplewebsite.entity.WheelPrizeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WheelPrizeTemplateRepository extends JpaRepository<WheelPrizeTemplate, Long> {
    
    /**
     * Find all prize templates for a specific wheel configuration, ordered by display order
     */
    List<WheelPrizeTemplate> findByWheelConfigurationOrderByDisplayOrder(WheelConfiguration wheelConfiguration);
    
    /**
     * Find all prize templates for a specific wheel configuration ID, ordered by display order
     */
    @Query("SELECT wpt FROM WheelPrizeTemplate wpt WHERE wpt.wheelConfiguration.id = :configId ORDER BY wpt.displayOrder")
    List<WheelPrizeTemplate> findByWheelConfigurationIdOrderByDisplayOrder(@Param("configId") Long configId);
    
    /**
     * Get the sum of all probabilities for a wheel configuration (should equal 100.00)
     */
    @Query("SELECT COALESCE(SUM(wpt.probability), 0) FROM WheelPrizeTemplate wpt WHERE wpt.wheelConfiguration = :wheelConfiguration")
    BigDecimal getTotalProbabilityByWheelConfiguration(@Param("wheelConfiguration") WheelConfiguration wheelConfiguration);
    
    /**
     * Get the sum of all probabilities for a wheel configuration ID
     */
    @Query("SELECT COALESCE(SUM(wpt.probability), 0) FROM WheelPrizeTemplate wpt WHERE wpt.wheelConfiguration.id = :configId")
    BigDecimal getTotalProbabilityByWheelConfigurationId(@Param("configId") Long configId);
    
    /**
     * Find the maximum display order for a wheel configuration
     */
    @Query("SELECT COALESCE(MAX(wpt.displayOrder), 0) FROM WheelPrizeTemplate wpt WHERE wpt.wheelConfiguration = :wheelConfiguration")
    Integer getMaxDisplayOrderByWheelConfiguration(@Param("wheelConfiguration") WheelConfiguration wheelConfiguration);
    
    /**
     * Delete all prize templates for a specific wheel configuration
     */
    void deleteByWheelConfiguration(WheelConfiguration wheelConfiguration);
    
    /**
     * Count prize templates for a wheel configuration
     */
    long countByWheelConfiguration(WheelConfiguration wheelConfiguration);
    
    /**
     * Find prize templates by wheel configuration and prize type
     */
    List<WheelPrizeTemplate> findByWheelConfigurationAndPrizeTypeOrderByDisplayOrder(WheelConfiguration wheelConfiguration, String prizeType);
}