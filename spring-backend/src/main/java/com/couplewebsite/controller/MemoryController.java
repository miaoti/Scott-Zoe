package com.couplewebsite.controller;

import com.couplewebsite.entity.Memory;
import com.couplewebsite.service.MemoryService;
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
@RequestMapping("/api/memories")

public class MemoryController {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoryController.class);
    
    @Autowired
    private MemoryService memoryService;
    
    @Autowired
    private SettingsService settingsService;
    
    /**
     * Create a new memory
     */
    @PostMapping
    public ResponseEntity<?> createMemory(@Valid @RequestBody CreateMemoryRequest request) {
        try {
            Memory.MemoryType type = Memory.MemoryType.fromValue(request.getType());
            Memory memory = memoryService.createMemory(
                    request.getTitle(),
                    request.getDescription(),
                    request.getDate(),
                    request.getEndDate(),
                    type
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Memory created successfully");
            response.put("memory", createMemoryResponse(memory));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating memory", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create memory: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all memories
     */
    @GetMapping
    public ResponseEntity<?> getAllMemories() {
        try {
            List<Memory> memories = memoryService.getAllMemories();
            
            List<Map<String, Object>> memoryResponses = memories.stream()
                    .map(this::createMemoryResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(memoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching memories", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get memory by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMemoryById(@PathVariable Long id) {
        try {
            Optional<Memory> memoryOpt = memoryService.getMemoryById(id);
            
            if (memoryOpt.isPresent()) {
                return ResponseEntity.ok(createMemoryResponse(memoryOpt.get()));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Memory not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching memory by ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Update memory
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMemory(@PathVariable Long id, @Valid @RequestBody CreateMemoryRequest request) {
        try {
            Memory.MemoryType type = Memory.MemoryType.fromValue(request.getType());
            Memory memory = memoryService.updateMemory(
                    id,
                    request.getTitle(),
                    request.getDescription(),
                    request.getDate(),
                    request.getEndDate(),
                    type
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Memory updated successfully");
            response.put("memory", createMemoryResponse(memory));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error updating memory with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Delete memory
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMemory(@PathVariable Long id) {
        try {
            boolean deleted = memoryService.deleteMemory(id);
            
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Memory deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Memory not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error deleting memory with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get memories by specific date
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<?> getMemoriesByDate(@PathVariable String date) {
        try {
            LocalDate targetDate = LocalDate.parse(date);
            List<Memory> memories = memoryService.getMemoriesByDate(targetDate);
            
            List<Map<String, Object>> memoryResponses = memories.stream()
                    .map(this::createMemoryResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(memoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching memories for date: {}", date, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get memories for a specific month
     */
    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<?> getMemoriesForMonth(@PathVariable int year, @PathVariable int month) {
        try {
            List<Memory> memories = memoryService.getMemoriesForMonth(year, month);
            
            List<Map<String, Object>> memoryResponses = memories.stream()
                    .map(this::createMemoryResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(memoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching memories for month: {}/{}", year, month, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get memories filtered by time period
     */
    @GetMapping("/filter")
    public ResponseEntity<?> getMemoriesFiltered(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String timeFilter) {
        try {
            List<Memory> memories = memoryService.getMemoriesFiltered(type, timeFilter);
            
            List<Map<String, Object>> memoryResponses = memories.stream()
                    .map(this::createMemoryResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(memoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching filtered memories with type: {} and timeFilter: {}", type, timeFilter, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get anniversary information
     */
    @GetMapping("/anniversary")
    public ResponseEntity<?> getAnniversaryInfo() {
        try {
            // Get relationship start date from settings
            LocalDate relationshipStartDate = settingsService.getRelationshipStartDate();
            
            // Calculate anniversary information
            MemoryService.AnniversaryInfo anniversaryInfo = memoryService.calculateAnniversary(relationshipStartDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalDays", anniversaryInfo.getTotalDays());
            response.put("years", anniversaryInfo.getYears());
            response.put("months", anniversaryInfo.getMonths());
            response.put("days", anniversaryInfo.getDays());
            response.put("nextAnniversary", anniversaryInfo.getNextAnniversary());
            response.put("daysUntilNextAnniversary", anniversaryInfo.getDaysUntilNextAnniversary());
            response.put("relationshipStartDate", relationshipStartDate);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error calculating anniversary info", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get upcoming anniversaries
     */
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingAnniversaries(@RequestParam(defaultValue = "30") int days) {
        try {
            List<Memory> upcomingMemories = memoryService.getUpcomingAnniversaries(days);
            
            List<Map<String, Object>> memoryResponses = upcomingMemories.stream()
                    .map(this::createMemoryResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(memoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching upcoming anniversaries", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Add photos to an EVENT memory
     */
    @PostMapping("/{id}/photos")
    public ResponseEntity<?> addPhotosToMemory(@PathVariable Long id, @RequestBody List<Long> photoIds) {
        try {
            Memory memory = memoryService.addPhotosToMemory(id, photoIds);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Photos added to memory successfully");
            response.put("memory", createMemoryResponse(memory));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error adding photos to memory with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Remove photos from an EVENT memory
     */
    @DeleteMapping("/{id}/photos")
    public ResponseEntity<?> removePhotosFromMemory(@PathVariable Long id, @RequestBody List<Long> photoIds) {
        try {
            Memory memory = memoryService.removePhotosFromMemory(id, photoIds);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Photos removed from memory successfully");
            response.put("memory", createMemoryResponse(memory));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error removing photos from memory with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper method to create memory response
    private Map<String, Object> createMemoryResponse(Memory memory) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", memory.getId());
        response.put("title", memory.getTitle());
        response.put("description", memory.getDescription());
        response.put("date", memory.getDate());
        response.put("endDate", memory.getEndDate());
        response.put("type", memory.getType().getValue());
        response.put("createdAt", memory.getCreatedAt());
        response.put("updatedAt", memory.getUpdatedAt());
        
        if (memory.getCreator() != null) {
            response.put("creator", Map.of("name", memory.getCreator().getName()));
        }
        
        // Include photos for EVENT type memories
        if (memory.getType() == Memory.MemoryType.EVENT && memory.getPhotos() != null) {
            List<Map<String, Object>> photoList = memory.getPhotos().stream()
                .map(photo -> {
                    Map<String, Object> photoMap = new HashMap<>();
                    photoMap.put("id", photo.getId());
                    photoMap.put("filename", photo.getFilename());
                    photoMap.put("originalName", photo.getOriginalName());
                    photoMap.put("caption", photo.getCaption());
                    return photoMap;
                })
                .collect(Collectors.toList());
            response.put("photos", photoList);
        }
        
        return response;
    }
    
    // Request DTO
    public static class CreateMemoryRequest {
        private String title;
        private String description;
        private LocalDate date;
        private LocalDate endDate;
        private String type;
        private List<String> selectedPhotos;
        
        // Getters and setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<String> getSelectedPhotos() { return selectedPhotos; }
        public void setSelectedPhotos(List<String> selectedPhotos) { this.selectedPhotos = selectedPhotos; }
    }
}
