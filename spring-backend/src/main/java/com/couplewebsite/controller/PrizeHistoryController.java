package com.couplewebsite.controller;

import com.couplewebsite.entity.PrizeHistory;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.service.PrizeHistoryService;
import com.couplewebsite.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/prize-history")
public class PrizeHistoryController {
    
    private static final Logger logger = LoggerFactory.getLogger(PrizeHistoryController.class);
    
    @Autowired
    private PrizeHistoryService prizeHistoryService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get prize history by recipient with pagination
     */
    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<?> getPrizeHistoryByRecipient(
            @PathVariable Long recipientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User recipient = userService.findById(recipientId);
            Pageable pageable = PageRequest.of(page, size);
            Page<PrizeHistory> historyPage = prizeHistoryService.getPrizeHistoryByRecipient(recipient.getId(), pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", historyPage.getContent().stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList()));
            response.put("totalElements", historyPage.getTotalElements());
            response.put("totalPages", historyPage.getTotalPages());
            response.put("currentPage", historyPage.getNumber());
            response.put("size", historyPage.getSize());
            response.put("hasNext", historyPage.hasNext());
            response.put("hasPrevious", historyPage.hasPrevious());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching prize history for recipient: {}", recipientId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all prize history by recipient (without pagination)
     */
    @GetMapping("/recipient/{recipientId}/all")
    public ResponseEntity<?> getAllPrizeHistoryByRecipient(@PathVariable Long recipientId) {
        try {
            User recipient = userService.findById(recipientId);
            List<PrizeHistory> history = prizeHistoryService.getAllPrizeHistoryByRecipient(recipient.getId());
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching all prize history for recipient: {}", recipientId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get prize history by completion type
     */
    @GetMapping("/completion-type/{completionType}")
    public ResponseEntity<?> getPrizeHistoryByCompletionType(
            @PathVariable String completionType,
            @RequestParam Long recipientId) {
        try {
            User recipient = userService.findById(recipientId);
            SurpriseBox.CompletionType type = SurpriseBox.CompletionType.valueOf(completionType.toUpperCase());
            List<PrizeHistory> history = prizeHistoryService.getPrizeHistoryByCompletionType(recipient.getId(), type);
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid completion type: " + completionType);
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error fetching prize history by completion type: {}", completionType, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get prize history within date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<?> getPrizeHistoryByDateRange(
            @RequestParam Long recipientId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            User recipient = userService.findById(recipientId);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            
            // Convert LocalDate to LocalDateTime (start of day and end of day)
            LocalDateTime startDateTime = start.atStartOfDay();
            LocalDateTime endDateTime = end.atTime(23, 59, 59);
            
            List<PrizeHistory> history = prizeHistoryService.getPrizeHistoryByDateRange(recipient.getId(), startDateTime, endDateTime);
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching prize history by date range", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Search prize history by prize name
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchPrizeHistory(
            @RequestParam Long recipientId,
            @RequestParam String query) {
        try {
            User recipient = userService.findById(recipientId);
            List<PrizeHistory> history = prizeHistoryService.searchPrizeHistoryByName(recipient, query);
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (Exception e) {
            logger.error("Error searching prize history with query: {}", query, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get recent prize history
     */
    @GetMapping("/recent/{recipientId}")
    public ResponseEntity<?> getRecentPrizeHistory(
            @PathVariable Long recipientId,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            User recipient = userService.findById(recipientId);
            List<PrizeHistory> history = prizeHistoryService.getRecentPrizeHistory(recipient.getId(), limit);
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching recent prize history for recipient: {}", recipientId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get prize history statistics
     */
    @GetMapping("/stats/{recipientId}")
    public ResponseEntity<?> getPrizeHistoryStats(@PathVariable Long recipientId) {
        try {
            User recipient = userService.findById(recipientId);
            PrizeHistoryService.PrizeHistoryStats stats = prizeHistoryService.getPrizeHistoryStats(recipient.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPrizes", stats.getTotalPrizes());
            response.put("prizesThisMonth", stats.getPrizesThisMonth());
            response.put("prizesThisYear", stats.getPrizesThisYear());
            response.put("completionTypeBreakdown", stats.getCompletionTypeBreakdown());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching prize history stats for recipient: {}", recipientId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get prize history by surprise box ID
     */
    @GetMapping("/box/{boxId}")
    public ResponseEntity<?> getPrizeHistoryByBox(@PathVariable Long boxId) {
        try {
            List<PrizeHistory> history = prizeHistoryService.getPrizeHistoryByBoxId(boxId);
            
            List<Map<String, Object>> historyResponses = history.stream()
                .map(this::createPrizeHistoryResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(historyResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching prize history for box: {}", boxId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get prize history by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPrizeHistoryById(@PathVariable Long id) {
        try {
            PrizeHistory history = prizeHistoryService.findById(id);
            return ResponseEntity.ok(createPrizeHistoryResponse(history));
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error fetching prize history by ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Delete prize history (admin function)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePrizeHistory(@PathVariable Long id) {
        try {
            prizeHistoryService.deletePrizeHistory(id);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Prize history deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error deleting prize history with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper method to create prize history response
    private Map<String, Object> createPrizeHistoryResponse(PrizeHistory history) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", history.getId());
        response.put("prizeName", history.getPrizeName());
        response.put("prizeDescription", history.getPrizeDescription());
        response.put("completionType", history.getCompletionType().name());
        response.put("claimedAt", history.getClaimedAt());
        
        if (history.getBox() != null) {
            Map<String, Object> boxMap = new HashMap<>();
            boxMap.put("id", history.getBox().getId());
            boxMap.put("completionCriteria", history.getBox().getCompletionCriteria());
            boxMap.put("createdAt", history.getBox().getCreatedAt());
            
            if (history.getBox().getOwner() != null) {
                Map<String, Object> ownerMap = new HashMap<>();
                ownerMap.put("id", history.getBox().getOwner().getId());
                ownerMap.put("name", history.getBox().getOwner().getName());
                ownerMap.put("username", history.getBox().getOwner().getUsername());
                boxMap.put("owner", ownerMap);
            }
            
            response.put("box", boxMap);
        }
        
        if (history.getRecipient() != null) {
            Map<String, Object> recipientMap = new HashMap<>();
            recipientMap.put("id", history.getRecipient().getId());
            recipientMap.put("name", history.getRecipient().getName());
            recipientMap.put("username", history.getRecipient().getUsername());
            response.put("recipient", recipientMap);
        }
        
        return response;
    }
}