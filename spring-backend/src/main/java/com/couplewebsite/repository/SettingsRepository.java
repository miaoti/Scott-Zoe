package com.couplewebsite.repository;

import com.couplewebsite.entity.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, Long> {
    
    /**
     * Find setting by key
     */
    Optional<Settings> findByKey(String key);
    
    /**
     * Check if setting key exists
     */
    boolean existsByKey(String key);
    
    /**
     * Delete setting by key
     */
    void deleteByKey(String key);
}
