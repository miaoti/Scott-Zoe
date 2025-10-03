package com.couplewebsite.controller;

import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.service.SurpriseBoxService;
import com.couplewebsite.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/surprise-boxes")
public class SurpriseBoxController {
    
    private static final Logger logger = LoggerFactory.getLogger(SurpriseBoxController.class);
    
    @Autowired
    private SurpriseBoxService surpriseBoxService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Create a new surprise box
     */
    @PostMapping
    public ResponseEntity<?> createBox(@Valid @RequestBody CreateBoxRequest request) {
        try {
            SurpriseBox.CompletionType completionType = SurpriseBox.CompletionType.valueOf(request.getCompletionType().toUpperCase());
            
            SurpriseBox box = surpriseBoxService.createBox(
                request.getOwnerId(),
                request.getRecipientId(),
                request.getPrizeName(),
                request.getPrizeDescription(),
                completionType,
                request.getExpiresAt(),
                request.getPriceAmount(),
                request.getTaskDescription(),
                request.getDropDelayMinutes()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Surprise box created successfully");
            response.put("box", createBoxResponse(box));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating surprise box", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create surprise box: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Update an existing surprise box (only owner can update)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBox(@PathVariable Long id, @Valid @RequestBody UpdateBoxRequest request) {
        try {
            SurpriseBox existingBox = surpriseBoxService.findById(id);
            
            // Verify owner
            if (!existingBox.getOwner().getId().equals(request.getOwnerId())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "You are not authorized to update this box.");
                return ResponseEntity.status(403).body(error);
            }
            
            // Only allow updates for CREATED status boxes
            if (existingBox.getStatus() != SurpriseBox.BoxStatus.CREATED) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Box cannot be updated. Current status: " + existingBox.getStatus());
                return ResponseEntity.status(400).body(error);
            }
            
            // Update fields
            existingBox.setPrizeName(request.getPrizeName());
            existingBox.setPrizeDescription(request.getPrizeDescription());
            existingBox.setPriceAmount(request.getPriceAmount());
            existingBox.setTaskDescription(request.getTaskDescription());
            existingBox.setExpirationMinutes(request.getExpirationMinutes());
            existingBox.setUpdatedAt(LocalDateTime.now());
            
            if (request.getCompletionType() != null) {
                SurpriseBox.CompletionType completionType = SurpriseBox.CompletionType.valueOf(request.getCompletionType().toUpperCase());
                existingBox.setCompletionType(completionType);
            }
            
            SurpriseBox updatedBox = surpriseBoxService.updateBox(existingBox);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Surprise box updated successfully");
            response.put("box", createBoxResponse(updatedBox));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error updating surprise box", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update surprise box: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get boxes owned by user
     */
    @GetMapping("/owned/{userId}")
    public ResponseEntity<?> getBoxesByOwner(@PathVariable Long userId) {
        try {
            User owner = userService.findById(userId);
            List<SurpriseBox> boxes = surpriseBoxService.getBoxesByOwner(owner);
            
            List<Map<String, Object>> boxResponses = boxes.stream()
                .map(this::createBoxResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(boxResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching boxes by owner: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get boxes received by user
     */
    @GetMapping("/received/{userId}")
    public ResponseEntity<?> getBoxesByRecipient(@PathVariable Long userId) {
        try {
            User recipient = userService.findById(userId);
            List<SurpriseBox> boxes = surpriseBoxService.getBoxesByRecipient(recipient);
            
            List<Map<String, Object>> boxResponses = boxes.stream()
                .map(this::createBoxResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(boxResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching boxes by recipient: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get dropped boxes for user (boxes available to claim)
     */
    @GetMapping("/dropped/{userId}")
    public ResponseEntity<?> getDroppedBoxesByRecipient(@PathVariable Long userId) {
        try {
            User recipient = userService.findById(userId);
            List<SurpriseBox> boxes = surpriseBoxService.getDroppedBoxesByRecipient(recipient);
            
            List<Map<String, Object>> boxResponses = boxes.stream()
                .map(this::createBoxResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(boxResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching dropped boxes by recipient: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get active box for user (both as owner and recipient)
     */
    @GetMapping("/active/{userId}")
    public ResponseEntity<?> getActiveBox(@PathVariable Long userId) {
        try {
            logger.info("🎯 Getting active box for userId: {}", userId);
            Optional<SurpriseBox> activeBox = surpriseBoxService.getActiveBox(userId);
            
            if (activeBox.isPresent()) {
                SurpriseBox box = activeBox.get();
                logger.info("🎯 Found active box: id={}, status={}, rejectionReason={}, isExpired={}", 
                    box.getId(), box.getStatus(), box.getRejectionReason(), box.isExpired());
                return ResponseEntity.ok(createBoxResponse(box));
            } else {
                logger.info("🎯 No active box found for userId: {}", userId);
                Map<String, String> response = new HashMap<>();
                response.put("message", "No active box found");
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching active box for user: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get box by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getBoxById(@PathVariable Long id) {
        try {
            SurpriseBox box = surpriseBoxService.findById(id);
            return ResponseEntity.ok(createBoxResponse(box));
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error fetching box by ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Open a box (recipient opens it)
     */
    @PostMapping("/{id}/open")
    public ResponseEntity<?> openBox(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            SurpriseBox box = surpriseBoxService.openBox(id, username);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Box opened successfully. Complete the task to proceed.");
            response.put("box", createBoxResponse(box));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error opening box with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Complete a box (recipient completes the task)
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBox(@PathVariable Long id, @RequestBody CompleteBoxRequest request) {
        try {
            SurpriseBox box = surpriseBoxService.completeBox(id, request.getUsername(), request.getCompletionData());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Task completed successfully. Waiting for owner approval.");
            response.put("box", createBoxResponse(box));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error completing box with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Approve box completion (owner approves)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveCompletion(@PathVariable Long id, @RequestBody Map<String, Long> request) {
        try {
            Long ownerId = request.get("ownerId");
            SurpriseBox box = surpriseBoxService.approveCompletion(id, ownerId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Box completion approved! Prize claimed successfully.");
            response.put("box", createBoxResponse(box));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error approving box completion with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Reject box completion (owner rejects)
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectCompletion(@PathVariable Long id, @RequestBody RejectCompletionRequest request) {
        try {
            SurpriseBox box = surpriseBoxService.rejectCompletion(id, request.getOwnerId(), request.getRejectionReason());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Box completion rejected. Box is available again with extended time.");
            response.put("box", createBoxResponse(box));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error rejecting box completion with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Cancel a box (owner cancels)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBox(@PathVariable Long id, @RequestParam Long ownerId) {
        try {
            surpriseBoxService.cancelBox(id, ownerId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Box cancelled successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error cancelling box with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get boxes waiting for approval by owner
     */
    @GetMapping("/waiting-approval/{userId}")
    public ResponseEntity<?> getBoxesWaitingForApproval(@PathVariable Long userId) {
        try {
            User owner = userService.findById(userId);
            List<SurpriseBox> boxes = surpriseBoxService.getBoxesWaitingForApproval(owner);
            
            List<Map<String, Object>> boxResponses = boxes.stream()
                .map(this::createBoxResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(boxResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching boxes waiting for approval by owner: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Check if user has active box
     */
    @GetMapping("/has-active/{userId}")
    public ResponseEntity<?> hasActiveBox(@PathVariable Long userId) {
        try {
            User owner = userService.findById(userId);
            boolean hasActive = surpriseBoxService.hasActiveBox(owner);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasActiveBox", hasActive);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error checking active box for user: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Activate a box when recipient clicks on it (makes it available for interaction without claiming)
     */
    @PostMapping("/activate/{boxId}")
    public ResponseEntity<?> activateBox(@PathVariable Long boxId, @RequestParam Long userId) {
        try {
            SurpriseBox activatedBox = surpriseBoxService.activateBox(boxId, userId);
            return ResponseEntity.ok(createBoxResponse(activatedBox));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Claim a box after the full workflow is completed (open -> complete -> approve)
     */
    @PostMapping("/claim/{boxId}")
    public ResponseEntity<?> claimBox(@PathVariable Long boxId, @RequestParam Long userId) {
        try {
            SurpriseBox claimedBox = surpriseBoxService.claimBox(boxId, userId);
            return ResponseEntity.ok(createBoxResponse(claimedBox));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get boxes that are ready to drop for a user
     */
    @GetMapping("/dropping/{userId}")
    public ResponseEntity<?> getDroppingBoxes(@PathVariable Long userId) {
        try {
            List<SurpriseBox> droppingBoxes = surpriseBoxService.getDroppingBoxes(userId);
            
            List<Map<String, Object>> boxResponses = droppingBoxes.stream()
                .map(this::createBoxResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(boxResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching dropping boxes for user: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper method to create box response
    private Map<String, Object> createBoxResponse(SurpriseBox box) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", box.getId());
        response.put("prizeName", box.getPrizeName());
        response.put("prizeDescription", box.getPrizeDescription());
        response.put("completionType", box.getCompletionType().name());
        response.put("status", box.getStatus().name());
        response.put("createdAt", box.getCreatedAt());
        response.put("dropAt", box.getDropAt());
        response.put("droppedAt", box.getDroppedAt());
        response.put("openedAt", box.getOpenedAt());
        response.put("claimedAt", box.getClaimedAt());
        response.put("expiresAt", box.getExpiresAt());
        response.put("rejectionReason", box.getRejectionReason());
        response.put("isExpired", box.isExpired());
        response.put("priceAmount", box.getPriceAmount());
        response.put("taskDescription", box.getTaskDescription());
        response.put("expirationMinutes", box.getExpirationMinutes());
        
        if (box.getOwner() != null) {
            Map<String, Object> ownerMap = new HashMap<>();
            ownerMap.put("id", box.getOwner().getId());
            ownerMap.put("name", box.getOwner().getName());
            ownerMap.put("username", box.getOwner().getUsername());
            response.put("owner", ownerMap);
        }
        
        if (box.getRecipient() != null) {
            Map<String, Object> recipientMap = new HashMap<>();
            recipientMap.put("id", box.getRecipient().getId());
            recipientMap.put("name", box.getRecipient().getName());
            recipientMap.put("username", box.getRecipient().getUsername());
            response.put("recipient", recipientMap);
        }
        
        return response;
    }
    
    // Request DTOs
    public static class CreateBoxRequest {
        private Long ownerId;
        private Long recipientId;
        private String prizeName;
        private String prizeDescription;
        private String completionType;
        private String expiresAt;
        private BigDecimal priceAmount;
        private String taskDescription;
        private Integer dropDelayMinutes;
        
        // Getters and setters
        public Long getOwnerId() { return ownerId; }
        public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
        public Long getRecipientId() { return recipientId; }
        public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
        public String getPrizeName() { return prizeName; }
        public void setPrizeName(String prizeName) { this.prizeName = prizeName; }
        public String getPrizeDescription() { return prizeDescription; }
        public void setPrizeDescription(String prizeDescription) { this.prizeDescription = prizeDescription; }
        public String getCompletionType() { return completionType; }
        public void setCompletionType(String completionType) { this.completionType = completionType; }
        public String getExpiresAt() { return expiresAt; }
        public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
        public BigDecimal getPriceAmount() { return priceAmount; }
        public void setPriceAmount(BigDecimal priceAmount) { this.priceAmount = priceAmount; }
        public String getTaskDescription() { return taskDescription; }
        public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }
        public Integer getDropDelayMinutes() { return dropDelayMinutes; }
        public void setDropDelayMinutes(Integer dropDelayMinutes) { this.dropDelayMinutes = dropDelayMinutes; }
    }
    
    public static class RejectCompletionRequest {
        private Long ownerId;
        private String rejectionReason;
        
        // Getters and setters
        public Long getOwnerId() { return ownerId; }
        public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    }
    
    public static class UpdateBoxRequest {
        private Long ownerId;
        private String prizeName;
        private String prizeDescription;
        private String completionType;
        private BigDecimal priceAmount;
        private String taskDescription;
        private Integer expirationMinutes;
        
        // Getters and setters
        public Long getOwnerId() { return ownerId; }
        public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
        public String getPrizeName() { return prizeName; }
        public void setPrizeName(String prizeName) { this.prizeName = prizeName; }
        public String getPrizeDescription() { return prizeDescription; }
        public void setPrizeDescription(String prizeDescription) { this.prizeDescription = prizeDescription; }
        public String getCompletionType() { return completionType; }
        public void setCompletionType(String completionType) { this.completionType = completionType; }
        public BigDecimal getPriceAmount() { return priceAmount; }
        public void setPriceAmount(BigDecimal priceAmount) { this.priceAmount = priceAmount; }
        public String getTaskDescription() { return taskDescription; }
        public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }
        public Integer getExpirationMinutes() { return expirationMinutes; }
        public void setExpirationMinutes(Integer expirationMinutes) { this.expirationMinutes = expirationMinutes; }
    }
    
    public static class CompleteBoxRequest {
        private String username;
        private String completionData;
        
        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getCompletionData() { return completionData; }
        public void setCompletionData(String completionData) { this.completionData = completionData; }
    }
}