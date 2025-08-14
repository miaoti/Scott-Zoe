package com.couplewebsite.controller;

import com.couplewebsite.entity.WheelPrize;
import com.couplewebsite.service.WheelPrizeService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wheel-prizes")
public class WheelPrizeController {
    
    private static final Logger logger = LoggerFactory.getLogger(WheelPrizeController.class);
    
    @Autowired
    private WheelPrizeService wheelPrizeService;
    
    /**
     * Record a new wheel prize
     */
    @PostMapping
    public ResponseEntity<?> recordPrize(@Valid @RequestBody RecordPrizeRequest request) {
        try {
            WheelPrize wheelPrize = wheelPrizeService.recordPrize(
                request.getPrizeType(), 
                request.getPrizeValue(), 
                request.getPrizeDescription()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Prize recorded successfully");
            response.put("prize", createPrizeResponse(wheelPrize));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error recording wheel prize", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to record prize");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all wheel prizes for current user
     */
    @GetMapping
    public ResponseEntity<?> getCurrentUserPrizes() {
        try {
            List<WheelPrize> prizes = wheelPrizeService.getCurrentUserPrizes();
            
            List<Map<String, Object>> prizeResponses = prizes.stream()
                .map(this::createPrizeResponse)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("prizes", prizeResponses);
            response.put("totalCount", prizes.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting wheel prizes", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get prizes");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get wheel prize statistics for current user
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getCurrentUserPrizeStats() {
        try {
            long totalCount = wheelPrizeService.getCurrentUserPrizeCount();
            Long totalValue = wheelPrizeService.getCurrentUserTotalPrizeValue();
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPrizes", totalCount);
            response.put("totalValue", totalValue != null ? totalValue : 0L);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting wheel prize stats", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get prize statistics");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get wheel prizes by type for current user
     */
    @GetMapping("/type/{prizeType}")
    public ResponseEntity<?> getCurrentUserPrizesByType(@PathVariable String prizeType) {
        try {
            List<WheelPrize> prizes = wheelPrizeService.getCurrentUserPrizesByType(prizeType);
            
            List<Map<String, Object>> prizeResponses = prizes.stream()
                .map(this::createPrizeResponse)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("prizes", prizeResponses);
            response.put("prizeType", prizeType);
            response.put("count", prizes.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting wheel prizes by type: {}", prizeType, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get prizes by type");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Helper method to create prize response
     */
    private Map<String, Object> createPrizeResponse(WheelPrize wheelPrize) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", wheelPrize.getId());
        response.put("prizeType", wheelPrize.getPrizeType());
        response.put("prizeValue", wheelPrize.getPrizeValue());
        response.put("prizeDescription", wheelPrize.getPrizeDescription());
        response.put("wonAt", wheelPrize.getWonAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return response;
    }
    
    // Request DTOs
    public static class RecordPrizeRequest {
        private String prizeType;
        private Integer prizeValue;
        private String prizeDescription;
        
        public String getPrizeType() { return prizeType; }
        public void setPrizeType(String prizeType) { this.prizeType = prizeType; }
        
        public Integer getPrizeValue() { return prizeValue; }
        public void setPrizeValue(Integer prizeValue) { this.prizeValue = prizeValue; }
        
        public String getPrizeDescription() { return prizeDescription; }
        public void setPrizeDescription(String prizeDescription) { this.prizeDescription = prizeDescription; }
    }
}