package com.couplewebsite.controller;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.Love;
import com.couplewebsite.entity.SavedOpportunity;
import com.couplewebsite.entity.Earnings;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.LoveService;
import com.couplewebsite.service.SavedOpportunityService;
import com.couplewebsite.service.EarningsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/developer")
public class DeveloperController {
    
    private static final Logger logger = LoggerFactory.getLogger(DeveloperController.class);
    private static final String DEVELOPER_PASSWORD = "5890";
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private LoveService loveService;
    
    @Autowired
    private SavedOpportunityService savedOpportunityService;
    
    @Autowired
    private EarningsService earningsService;
    
    /**
     * Verify developer password
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPassword(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            // Only Scott can access developer settings
            if (!"scott".equals(username)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Access denied. Only Scott can access developer settings.");
                return ResponseEntity.status(403).body(response);
            }
            
            String password = request.get("password");
            boolean isValid = DEVELOPER_PASSWORD.equals(password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", isValid);
            response.put("message", isValid ? "Access granted" : "Invalid password");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error verifying developer password", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Server error");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get all user data for developer settings
     */
    @PostMapping("/data")
    public ResponseEntity<?> getDeveloperData(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            // Only Scott can access developer settings
            if (!"scott".equals(username)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }
            
            String password = request.get("password");
            if (!DEVELOPER_PASSWORD.equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
            }
            
            // Get both users
            User scott = userService.findByUsername("scott");
            User zoe = userService.findByUsername("zoe");
            
            // Get love stats
            LoveService.LoveStats loveStats = loveService.getLoveStats();
            
            // Get opportunities for both users
            SavedOpportunityService.OpportunityStats scottOpportunities = savedOpportunityService.getOpportunityStats(scott);
            SavedOpportunityService.OpportunityStats zoeOpportunities = savedOpportunityService.getOpportunityStats(zoe);
            
            // Get earnings history for both users
            List<Earnings> scottEarnings = earningsService.getEarningsHistory(scott);
            List<Earnings> zoeEarnings = earningsService.getEarningsHistory(zoe);
            
            Map<String, Object> response = new HashMap<>();
            response.put("loveCount", loveStats.getTotalCount());
            response.put("scott", Map.of(
                "opportunities", scottOpportunities.getUnused(),
                "earningsHistory", scottEarnings
            ));
            response.put("zoe", Map.of(
                "opportunities", zoeOpportunities.getUnused(),
                "earningsHistory", zoeEarnings
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting developer data", e);
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
    
    /**
     * Update love counter
     */
    @PostMapping("/love/set")
    public ResponseEntity<?> setLoveCount(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            if (!"scott".equals(username)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }
            
            String password = (String) request.get("password");
            if (!DEVELOPER_PASSWORD.equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
            }
            
            Long newCount = Long.valueOf(request.get("count").toString());
            Love love = loveService.setLoveCount(newCount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Love count updated successfully");
            response.put("count", love.getCountValue());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error setting love count", e);
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
    
    /**
     * Update opportunities for a user
     */
    @PostMapping("/opportunities/set")
    public ResponseEntity<?> setOpportunities(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            if (!"scott".equals(username)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }
            
            String password = (String) request.get("password");
            if (!DEVELOPER_PASSWORD.equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
            }
            
            String targetUser = (String) request.get("targetUser");
            Integer newCount = Integer.valueOf(request.get("count").toString());
            
            User user = userService.findByUsername(targetUser);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            // Clear existing unused opportunities
            savedOpportunityService.clearUnusedOpportunities(user);
            
            // Add new opportunities
            for (int i = 0; i < newCount; i++) {
                savedOpportunityService.createSavedOpportunity(user, "developer_adjustment");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Opportunities updated successfully");
            response.put("count", newCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error setting opportunities", e);
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
    
    /**
     * Clear earnings history for a user
     */
    @PostMapping("/earnings/clear")
    public ResponseEntity<?> clearEarnings(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            if (!"scott".equals(username)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }
            
            String password = (String) request.get("password");
            if (!DEVELOPER_PASSWORD.equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
            }
            
            String targetUser = (String) request.get("targetUser");
            
            User user = userService.findByUsername(targetUser);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            earningsService.clearEarningsHistory(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Earnings history cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error clearing earnings", e);
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
}