package com.couplewebsite.controller;

import com.couplewebsite.entity.Love;
import com.couplewebsite.service.LoveService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/love")

public class LoveController {
    
    private static final Logger logger = LoggerFactory.getLogger(LoveController.class);
    
    @Autowired
    private LoveService loveService;
    
    @Autowired
    private LoveUpdatesController loveUpdatesController;
    
    /**
     * Get shared love count and statistics (synchronized between Scott and Zoe)
     */
    @GetMapping
    public ResponseEntity<?> getLoveStats() {
        try {
            LoveService.LoveStats stats = loveService.getLoveStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", stats.getCurrentUserCount());
            response.put("totalCount", stats.getTotalCount());
            response.put("nextMilestone", stats.getNextMilestone());
            response.put("remainingToMilestone", stats.getRemainingToMilestone());
            response.put("currentLevel", stats.getCurrentLevel());
            response.put("progressPercent", stats.getProgressPercent());
            response.put("isMilestoneReached", loveService.isMilestoneReached(stats.getCurrentUserCount()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting love stats", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Increment shared love count (synchronized between Scott and Zoe)
     */
    @PostMapping("/increment")
    public ResponseEntity<?> incrementLove() {
        try {
            Love love = loveService.incrementLoveCount();
            LoveService.LoveStats stats = loveService.getLoveStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Love shared successfully! 💕");
            response.put("count", love.getCountValue());
            response.put("totalCount", stats.getTotalCount());
            response.put("nextMilestone", stats.getNextMilestone());
            response.put("remainingToMilestone", stats.getRemainingToMilestone());
            response.put("currentLevel", stats.getCurrentLevel());
            response.put("progressPercent", stats.getProgressPercent());
            response.put("isMilestoneReached", loveService.isMilestoneReached(love.getCountValue()));
            response.put("justReachedMilestone", loveService.isMilestoneReached(love.getCountValue()));
            
            // Notify partner about the love count update
            try {
                loveUpdatesController.notifyPartner();
            } catch (Exception notifyException) {
                logger.warn("Failed to notify partner about love count update", notifyException);
                // Don't fail the main request if notification fails
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error incrementing love count", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to share love: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Set shared love count to a specific value (for admin/testing purposes)
     */
    @PostMapping("/set")
    public ResponseEntity<?> setLoveCount(@Valid @RequestBody SetLoveCountRequest request) {
        try {
            Love love = loveService.setLoveCount(request.getCount());
            LoveService.LoveStats stats = loveService.getLoveStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Love count updated successfully");
            response.put("count", love.getCountValue());
            response.put("totalCount", stats.getTotalCount());
            response.put("nextMilestone", stats.getNextMilestone());
            response.put("remainingToMilestone", stats.getRemainingToMilestone());
            response.put("currentLevel", stats.getCurrentLevel());
            response.put("progressPercent", stats.getProgressPercent());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error setting love count", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to set love count: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get total love count across all users
     */
    @GetMapping("/total")
    public ResponseEntity<?> getTotalLoveCount() {
        try {
            Long totalCount = loveService.getTotalLoveCount();
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalCount", totalCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting total love count", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get partner's love count (Scott sees Zoe's count, Zoe sees Scott's count)
     */
    @GetMapping("/partner")
    public ResponseEntity<?> getPartnerLoveCount() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            String partnerUsername = "scott".equals(currentUsername) ? "zoe" : "scott";
            
            Long partnerLoveCount = loveService.getLoveCountByUsername(partnerUsername);
            
            Map<String, Object> response = new HashMap<>();
            response.put("partnerUsername", partnerUsername);
            response.put("partnerLoveCount", partnerLoveCount);
            response.put("partnerDisplayName", "scott".equals(partnerUsername) ? "Scott" : "Zoe");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting partner love count", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Request DTO
    public static class SetLoveCountRequest {
        private Long count;
        
        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }
}
