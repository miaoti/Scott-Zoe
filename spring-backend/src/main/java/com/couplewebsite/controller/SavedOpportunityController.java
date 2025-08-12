package com.couplewebsite.controller;

import com.couplewebsite.entity.SavedOpportunity;
import com.couplewebsite.entity.User;
import com.couplewebsite.service.SavedOpportunityService;
import com.couplewebsite.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/opportunities")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SavedOpportunityController {
    
    private static final Logger logger = LoggerFactory.getLogger(SavedOpportunityController.class);
    
    @Autowired
    private SavedOpportunityService savedOpportunityService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get saved opportunity stats for current user
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getOpportunityStats(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            SavedOpportunityService.OpportunityStats stats = 
                    savedOpportunityService.getOpportunityStats(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("total", stats.getTotal());
            response.put("unused", stats.getUnused());
            response.put("used", stats.getUsed());
            response.put("hasUnused", stats.getUnused() > 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting opportunity stats", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all unused opportunities for current user
     */
    @GetMapping("/unused")
    public ResponseEntity<?> getUnusedOpportunities(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            List<SavedOpportunity> opportunities = 
                    savedOpportunityService.getUnusedOpportunities(user);
            
            return ResponseEntity.ok(opportunities);
            
        } catch (Exception e) {
            logger.error("Error getting unused opportunities", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Create a new saved opportunity
     */
    @PostMapping("/create")
    public ResponseEntity<?> createOpportunity(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            String source = request.getOrDefault("source", "milestone_520");
            
            SavedOpportunity opportunity = 
                    savedOpportunityService.createSavedOpportunity(user, source);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Opportunity saved successfully");
            response.put("opportunityId", opportunity.getId());
            response.put("createdAt", opportunity.getCreatedAt().toString());
            response.put("source", opportunity.getSource());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating opportunity", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create opportunity: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Use the oldest saved opportunity
     */
    @PostMapping("/use")
    public ResponseEntity<?> useOpportunity(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            Optional<SavedOpportunity> usedOpportunity = 
                    savedOpportunityService.useOldestOpportunity(user);
            
            if (usedOpportunity.isPresent()) {
                SavedOpportunity opportunity = usedOpportunity.get();
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Opportunity used successfully");
                response.put("opportunityId", opportunity.getId());
                response.put("usedAt", opportunity.getUsedAt().toString());
                response.put("source", opportunity.getSource());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No unused opportunities available");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error using opportunity", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to use opportunity: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all opportunities (used and unused) for current user
     */
    @GetMapping("/history")
    public ResponseEntity<?> getOpportunityHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            List<SavedOpportunity> opportunities = 
                    savedOpportunityService.getAllOpportunities(user);
            
            return ResponseEntity.ok(opportunities);
            
        } catch (Exception e) {
            logger.error("Error getting opportunity history", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
}