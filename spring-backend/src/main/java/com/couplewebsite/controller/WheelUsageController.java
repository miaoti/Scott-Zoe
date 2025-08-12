package com.couplewebsite.controller;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WheelUsage;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.WheelUsageService;
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
@RequestMapping("/api/wheel")

public class WheelUsageController {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelUsageController.class);
    
    @Autowired
    private WheelUsageService wheelUsageService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get wheel usage stats for current user
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getWheelStats(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            WheelUsageService.WheelUsageStats stats = wheelUsageService.getWheelUsageStats(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("canUseThisWeek", stats.canUseThisWeek());
            response.put("hasUsedThisWeek", !stats.canUseThisWeek());
            response.put("currentWeekStart", stats.getCurrentWeekStart().toString());
            response.put("totalPrizesWon", stats.getTotalPrizesWon());
            response.put("totalUsages", stats.getTotalUsages());
            
            if (stats.getThisWeekUsage() != null) {
                WheelUsage usage = stats.getThisWeekUsage();
                Map<String, Object> thisWeekUsage = new HashMap<>();
                thisWeekUsage.put("usedAt", usage.getUsedAt().toString());
                thisWeekUsage.put("prizeAmount", usage.getPrizeAmount());
                thisWeekUsage.put("source", usage.getSource());
                response.put("thisWeekUsage", thisWeekUsage);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting wheel stats", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Record wheel usage
     */
    @PostMapping("/use")
    public ResponseEntity<?> recordWheelUsage(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            Integer prizeAmount = (Integer) request.get("prizeAmount");
            String source = (String) request.get("source");
            
            if (prizeAmount == null || prizeAmount < 0) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid prize amount");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (source == null || source.trim().isEmpty()) {
                source = "weekly";
            }
            
            // Check if user can use wheel
            if (!wheelUsageService.canUseWheel(user)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Wheel already used this week");
                return ResponseEntity.badRequest().body(error);
            }
            
            WheelUsage wheelUsage = wheelUsageService.recordWheelUsage(user, prizeAmount, source);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Wheel usage recorded successfully");
            response.put("usedAt", wheelUsage.getUsedAt().toString());
            response.put("prizeAmount", wheelUsage.getPrizeAmount());
            response.put("source", wheelUsage.getSource());
            response.put("weekStart", wheelUsage.getWeekStart().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error recording wheel usage", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to record wheel usage: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get wheel usage history for current user
     */
    @GetMapping("/history")
    public ResponseEntity<?> getWheelHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            List<WheelUsage> history = wheelUsageService.getWheelUsageHistory(user);
            
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            logger.error("Error getting wheel history", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
}
