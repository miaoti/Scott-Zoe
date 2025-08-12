package com.couplewebsite.service;

import com.couplewebsite.entity.Settings;
import com.couplewebsite.repository.SettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SettingsService {
    
    private static final Logger logger = LoggerFactory.getLogger(SettingsService.class);
    
    @Autowired
    private SettingsRepository settingsRepository;
    
    /**
     * Get all settings
     */
    public List<Settings> getAllSettings() {
        return settingsRepository.findAll();
    }
    
    /**
     * Get setting by key
     */
    public Optional<Settings> getSettingByKey(String key) {
        return settingsRepository.findByKey(key);
    }
    
    /**
     * Get setting value by key
     */
    public String getSettingValue(String key) {
        return settingsRepository.findByKey(key)
                .map(Settings::getValue)
                .orElse(null);
    }
    
    /**
     * Set setting value
     */
    public Settings setSetting(String key, String value) {
        Optional<Settings> existingSetting = settingsRepository.findByKey(key);
        
        if (existingSetting.isPresent()) {
            Settings setting = existingSetting.get();
            setting.setValue(value);
            return settingsRepository.save(setting);
        } else {
            Settings newSetting = new Settings(key, value);
            return settingsRepository.save(newSetting);
        }
    }
    
    /**
     * Delete setting by key
     */
    public boolean deleteSetting(String key) {
        try {
            if (settingsRepository.existsByKey(key)) {
                settingsRepository.deleteByKey(key);
                logger.info("Setting deleted: {}", key);
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error deleting setting: {}", key, e);
            return false;
        }
    }
    
    /**
     * Get relationship start date
     */
    public LocalDate getRelationshipStartDate() {
        String dateString = getSettingValue("relationshipStartDate");
        if (dateString != null) {
            try {
                return LocalDate.parse(dateString);
            } catch (DateTimeParseException e) {
                logger.error("Invalid date format for relationshipStartDate: {}", dateString, e);
            }
        }
        
        // Default fallback date
        return LocalDate.of(2020, 8, 6);
    }
    
    /**
     * Set relationship start date
     */
    public void setRelationshipStartDate(LocalDate date) {
        setSetting("relationshipStartDate", date.toString());
    }
}
