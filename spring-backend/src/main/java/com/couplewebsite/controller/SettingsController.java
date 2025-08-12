package com.couplewebsite.controller;

import com.couplewebsite.entity.Settings;
import com.couplewebsite.service.SettingsService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")

public class SettingsController {
    
    private static final Logger logger = LoggerFactory.getLogger(SettingsController.class);
    
    @Autowired
    private SettingsService settingsService;
    
    /**
     * Get all settings
     */
    @GetMapping
    public ResponseEntity<?> getAllSettings() {
        try {
            List<Settings> settings = settingsService.getAllSettings();
            
            List<Map<String, Object>> settingsResponses = settings.stream()
                    .map(this::createSettingsResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(settingsResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching settings", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get setting by key
     */
    @GetMapping("/{key}")
    public ResponseEntity<?> getSettingByKey(@PathVariable String key) {
        try {
            Optional<Settings> settingOpt = settingsService.getSettingByKey(key);
            
            if (settingOpt.isPresent()) {
                return ResponseEntity.ok(createSettingsResponse(settingOpt.get()));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Setting not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching setting by key: {}", key, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Set or update setting
     */
    @PostMapping
    public ResponseEntity<?> setSetting(@Valid @RequestBody SetSettingRequest request) {
        try {
            Settings setting = settingsService.setSetting(request.getKey(), request.getValue());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Setting saved successfully");
            response.put("setting", createSettingsResponse(setting));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error setting value for key: {}", request.getKey(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to save setting");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Update existing setting
     */
    @PutMapping("/{key}")
    public ResponseEntity<?> updateSetting(@PathVariable String key, @Valid @RequestBody UpdateSettingRequest request) {
        try {
            Settings setting = settingsService.setSetting(key, request.getValue());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Setting updated successfully");
            response.put("setting", createSettingsResponse(setting));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating setting with key: {}", key, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update setting");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Delete setting
     */
    @DeleteMapping("/{key}")
    public ResponseEntity<?> deleteSetting(@PathVariable String key) {
        try {
            boolean deleted = settingsService.deleteSetting(key);
            
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Setting deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Setting not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error deleting setting with key: {}", key, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get relationship start date
     */
    @GetMapping("/relationship-start-date")
    public ResponseEntity<?> getRelationshipStartDate() {
        try {
            LocalDate startDate = settingsService.getRelationshipStartDate();
            
            Map<String, Object> response = new HashMap<>();
            response.put("relationshipStartDate", startDate);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting relationship start date", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Set relationship start date
     */
    @PostMapping("/relationship-start-date")
    public ResponseEntity<?> setRelationshipStartDate(@Valid @RequestBody SetDateRequest request) {
        try {
            settingsService.setRelationshipStartDate(request.getDate());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Relationship start date updated successfully");
            response.put("relationshipStartDate", request.getDate());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error setting relationship start date", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update relationship start date");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper method
    private Map<String, Object> createSettingsResponse(Settings setting) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", setting.getId());
        response.put("key", setting.getKey());
        response.put("value", setting.getValue());
        response.put("createdAt", setting.getCreatedAt());
        response.put("updatedAt", setting.getUpdatedAt());
        return response;
    }
    
    // Request DTOs
    public static class SetSettingRequest {
        private String key;
        private String value;
        
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
    
    public static class UpdateSettingRequest {
        private String value;
        
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
    
    public static class SetDateRequest {
        private LocalDate date;
        
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
    }
}
