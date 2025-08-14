package com.couplewebsite.controller;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelConfiguration;
import com.couplewebsite.entity.WheelPrizeTemplate;
import com.couplewebsite.service.WheelConfigurationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wheel-config")
public class WheelConfigurationController {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelConfigurationController.class);
    
    @Autowired
    private WheelConfigurationService wheelConfigurationService;
    
    /**
     * Get current user's active wheel configuration
     */
    @GetMapping("/my-wheel")
    public ResponseEntity<?> getMyWheelConfiguration() {
        try {
            Optional<WheelConfiguration> configOpt = wheelConfigurationService.getCurrentUserActiveWheelConfiguration();
            
            if (configOpt.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("hasConfiguration", false);
                response.put("message", "No wheel configuration found");
                return ResponseEntity.ok(response);
            }
            
            WheelConfiguration config = configOpt.get();
            List<WheelPrizeTemplate> prizeTemplates = wheelConfigurationService.getPrizeTemplates(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasConfiguration", true);
            response.put("configuration", createConfigurationResponse(config));
            response.put("prizes", prizeTemplates.stream()
                    .map(this::createPrizeTemplateResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting wheel configuration", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get wheel configuration");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get other user's active wheel configuration by user ID
     */
    @GetMapping("/other-user-wheel/{userId}")
    public ResponseEntity<?> getOtherUserWheelConfiguration(@PathVariable Long userId) {
        try {
            Optional<WheelConfiguration> configOpt = wheelConfigurationService.getWheelConfigurationByUserId(userId);
            
            if (configOpt.isEmpty()) {
                // Create default configuration for the other user
                User otherUser = wheelConfigurationService.getUserById(userId);
                if (otherUser == null) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "User not found");
                    return ResponseEntity.status(404).body(error);
                }
                
                WheelConfiguration defaultConfig = wheelConfigurationService.createDefaultWheelConfiguration(otherUser);
                List<WheelPrizeTemplate> prizeTemplates = wheelConfigurationService.getPrizeTemplates(defaultConfig);
                
                Map<String, Object> response = new HashMap<>();
                response.put("hasConfiguration", true);
                response.put("isDefault", true);
                response.put("configuration", createConfigurationResponse(defaultConfig));
                response.put("prizes", prizeTemplates.stream()
                        .map(this::createPrizeTemplateResponse)
                        .collect(Collectors.toList()));
                
                return ResponseEntity.ok(response);
            }
            
            WheelConfiguration config = configOpt.get();
            List<WheelPrizeTemplate> prizeTemplates = wheelConfigurationService.getPrizeTemplates(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasConfiguration", true);
            response.put("isDefault", false);
            response.put("configuration", createConfigurationResponse(config));
            response.put("prizes", prizeTemplates.stream()
                    .map(this::createPrizeTemplateResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting other user's wheel configuration", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get other user's wheel configuration");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get other user's active wheel configuration (for cross-user management)
     */
    @GetMapping("/other-wheel")
    public ResponseEntity<?> getOtherUserWheelConfiguration() {
        try {
            if (!wheelConfigurationService.canConfigureWheelForOtherUser()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Not authorized to configure other user's wheel");
                return ResponseEntity.status(403).body(error);
            }
            
            Optional<WheelConfiguration> configOpt = wheelConfigurationService.getOtherUserActiveWheelConfiguration();
            
            if (configOpt.isEmpty()) {
                // Create default configuration for the other user
                User otherUser = wheelConfigurationService.getOtherUser();
                WheelConfiguration defaultConfig = wheelConfigurationService.createDefaultWheelConfiguration(otherUser);
                List<WheelPrizeTemplate> prizeTemplates = wheelConfigurationService.getPrizeTemplates(defaultConfig);
                
                Map<String, Object> response = new HashMap<>();
                response.put("hasConfiguration", true);
                response.put("isDefault", true);
                response.put("configuration", createConfigurationResponse(defaultConfig));
                response.put("prizes", prizeTemplates.stream()
                        .map(this::createPrizeTemplateResponse)
                        .collect(Collectors.toList()));
                
                return ResponseEntity.ok(response);
            }
            
            WheelConfiguration config = configOpt.get();
            List<WheelPrizeTemplate> prizeTemplates = wheelConfigurationService.getPrizeTemplates(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasConfiguration", true);
            response.put("isDefault", false);
            response.put("configuration", createConfigurationResponse(config));
            response.put("prizes", prizeTemplates.stream()
                    .map(this::createPrizeTemplateResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting other user's wheel configuration", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get other user's wheel configuration");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Save wheel configuration for specific user
     */
    @PostMapping("/save-for-user/{userId}")
    public ResponseEntity<?> saveWheelConfigurationForUser(@PathVariable Long userId, @Valid @RequestBody ConfigureWheelRequest request) {
        try {
            logger.info("Received save request for user {}: {}", userId, request);
            logger.info("Request prizes count: {}", request.getPrizes() != null ? request.getPrizes().size() : "null");
            
            // Validate that probabilities sum to 100%
            BigDecimal totalProbability = request.getPrizes().stream()
                    .map(prize -> new BigDecimal(prize.getProbability().toString()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            logger.info("Total probability calculated: {}", totalProbability);
            
            // Use tolerance for floating-point precision issues from JavaScript
            BigDecimal tolerance = new BigDecimal("1.0");
            BigDecimal target = new BigDecimal("100.00");
            BigDecimal difference = totalProbability.subtract(target).abs();
            
            if (difference.compareTo(tolerance) > 0) {
                logger.warn("Probability validation failed. Total: {}, difference: {}", totalProbability, difference);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Total probability must equal 100% (±1.0%). Current total: " + totalProbability + "%");
                return ResponseEntity.badRequest().body(error);
            }
            
            User targetUser = wheelConfigurationService.getUserById(userId);
            if (targetUser == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.status(404).body(error);
            }
            
            // Convert request to prize templates
            List<WheelPrizeTemplate> prizeTemplates = request.getPrizes().stream()
                    .map(prizeRequest -> {
                        WheelPrizeTemplate template = new WheelPrizeTemplate();
                        template.setPrizeName(prizeRequest.getPrizeName());
                        template.setPrizeDescription(prizeRequest.getPrizeDescription());
                        template.setPrizeType(prizeRequest.getPrizeType());
                        template.setPrizeValue(prizeRequest.getPrizeValue());
                        template.setProbability(new BigDecimal(prizeRequest.getProbability().toString()));
                        template.setColor(prizeRequest.getColor());
                        return template;
                    })
                    .collect(Collectors.toList());
            
            WheelConfiguration savedConfig = wheelConfigurationService.saveWheelConfiguration(targetUser, prizeTemplates);
            List<WheelPrizeTemplate> savedPrizeTemplates = wheelConfigurationService.getPrizeTemplates(savedConfig);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Wheel configuration saved successfully");
            response.put("configuration", createConfigurationResponse(savedConfig));
            response.put("prizes", savedPrizeTemplates.stream()
                    .map(this::createPrizeTemplateResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error saving wheel configuration for user", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to save wheel configuration");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Save wheel configuration for other user
     */
    @PostMapping("/configure-other-wheel")
    public ResponseEntity<?> configureOtherUserWheel(@Valid @RequestBody ConfigureWheelRequest request) {
        try {
            if (!wheelConfigurationService.canConfigureWheelForOtherUser()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Not authorized to configure other user's wheel");
                return ResponseEntity.status(403).body(error);
            }
            
            // Validate that probabilities sum to 100%
            BigDecimal totalProbability = request.getPrizes().stream()
                    .map(prize -> new BigDecimal(prize.getProbability().toString()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            if (totalProbability.compareTo(new BigDecimal("100.00")) != 0) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Total probability must equal 100%. Current total: " + totalProbability + "%");
                return ResponseEntity.badRequest().body(error);
            }
            
            User otherUser = wheelConfigurationService.getOtherUser();
            
            // Convert request to prize templates
            List<WheelPrizeTemplate> prizeTemplates = request.getPrizes().stream()
                    .map(prizeRequest -> {
                        WheelPrizeTemplate template = new WheelPrizeTemplate();
                        template.setPrizeName(prizeRequest.getPrizeName());
                        template.setPrizeDescription(prizeRequest.getPrizeDescription());
                        template.setPrizeType(prizeRequest.getPrizeType());
                        template.setPrizeValue(prizeRequest.getPrizeValue());
                        template.setProbability(new BigDecimal(prizeRequest.getProbability().toString()));
                        template.setColor(prizeRequest.getColor());
                        return template;
                    })
                    .collect(Collectors.toList());
            
            WheelConfiguration savedConfig = wheelConfigurationService.saveWheelConfiguration(otherUser, prizeTemplates);
            List<WheelPrizeTemplate> savedPrizeTemplates = wheelConfigurationService.getPrizeTemplates(savedConfig);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Wheel configuration saved successfully");
            response.put("configuration", createConfigurationResponse(savedConfig));
            response.put("prizes", savedPrizeTemplates.stream()
                    .map(this::createPrizeTemplateResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error configuring other user's wheel", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to configure wheel");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Helper method to create configuration response
     */
    private Map<String, Object> createConfigurationResponse(WheelConfiguration config) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", config.getId());
        response.put("ownerUsername", config.getOwnerUser().getUsername());
        response.put("configuredByUsername", config.getConfiguredByUser().getUsername());
        response.put("isActive", config.getIsActive());
        response.put("createdAt", config.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        response.put("updatedAt", config.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return response;
    }
    
    /**
     * Helper method to create prize template response
     */
    private Map<String, Object> createPrizeTemplateResponse(WheelPrizeTemplate template) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", template.getId());
        response.put("prizeName", template.getPrizeName());
        response.put("prizeDescription", template.getPrizeDescription());
        response.put("prizeType", template.getPrizeType());
        response.put("prizeValue", template.getPrizeValue());
        response.put("probability", template.getProbability());
        response.put("color", template.getColor());
        response.put("displayOrder", template.getDisplayOrder());
        return response;
    }
    
    // Request DTOs
    public static class ConfigureWheelRequest {
        @jakarta.validation.constraints.NotNull(message = "Prizes list cannot be null")
        @jakarta.validation.constraints.NotEmpty(message = "Prizes list cannot be empty")
        @jakarta.validation.Valid
        private List<PrizeTemplateRequest> prizes;
        
        public List<PrizeTemplateRequest> getPrizes() {
            return prizes;
        }
        
        public void setPrizes(List<PrizeTemplateRequest> prizes) {
            this.prizes = prizes;
        }
        
        @Override
        public String toString() {
            return "ConfigureWheelRequest{prizes=" + prizes + "}";
        }
    }
    
    public static class PrizeTemplateRequest {
        @jakarta.validation.constraints.NotBlank(message = "Prize name cannot be blank")
        private String prizeName;
        
        @jakarta.validation.constraints.NotBlank(message = "Prize description cannot be blank")
        private String prizeDescription;
        
        @jakarta.validation.constraints.NotBlank(message = "Prize type cannot be blank")
        private String prizeType;
        
        @jakarta.validation.constraints.NotNull(message = "Prize value cannot be null")
        @jakarta.validation.constraints.Positive(message = "Prize value must be positive")
        private Integer prizeValue;
        
        @jakarta.validation.constraints.NotNull(message = "Probability cannot be null")
        @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Probability must be at least 0.01")
        @jakarta.validation.constraints.DecimalMax(value = "100.0", message = "Probability cannot exceed 100")
        private Double probability;
        
        @jakarta.validation.constraints.NotBlank(message = "Color cannot be blank")
        private String color;
        
        // Getters and setters
        public String getPrizeName() {
            return prizeName;
        }
        
        public void setPrizeName(String prizeName) {
            this.prizeName = prizeName;
        }
        
        public String getPrizeDescription() {
            return prizeDescription;
        }
        
        public void setPrizeDescription(String prizeDescription) {
            this.prizeDescription = prizeDescription;
        }
        
        public String getPrizeType() {
            return prizeType;
        }
        
        public void setPrizeType(String prizeType) {
            this.prizeType = prizeType;
        }
        
        public Integer getPrizeValue() {
            return prizeValue;
        }
        
        public void setPrizeValue(Integer prizeValue) {
            this.prizeValue = prizeValue;
        }
        
        public Double getProbability() {
            return probability;
        }
        
        public void setProbability(Double probability) {
            this.probability = probability;
        }
        
        public String getColor() {
            return color;
        }
        
        public void setColor(String color) {
            this.color = color;
        }
        
        @Override
        public String toString() {
            return "PrizeTemplateRequest{" +
                    "prizeName='" + prizeName + "'" +
                    ", prizeDescription='" + prizeDescription + "'" +
                    ", prizeType='" + prizeType + "'" +
                    ", prizeValue=" + prizeValue +
                    ", probability=" + probability +
                    ", color='" + color + "'" +
                    "}";
        }
    }
}