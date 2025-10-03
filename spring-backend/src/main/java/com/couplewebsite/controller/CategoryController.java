package com.couplewebsite.controller;

import com.couplewebsite.entity.Category;
import com.couplewebsite.entity.Photo;
import com.couplewebsite.service.CategoryService;
import com.couplewebsite.service.PhotoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")

public class CategoryController {
    
    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);
    
    @Autowired
    private CategoryService categoryService;
    
    @Autowired
    private PhotoService photoService;
    
    /**
     * Create a new category
     */
    @PostMapping
    public ResponseEntity<?> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        try {
            Category category = categoryService.createCategory(
                    request.getName(),
                    request.getDescription(),
                    request.getColor()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Category created successfully");
            response.put("category", createCategoryResponse(category));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            logger.error("Error creating category", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create category");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all categories
     */
    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            logger.info("Fetching all categories with photo counts");
            List<Category> categories = categoryService.getAllCategoriesWithPhotoCounts();
            logger.info("Found {} categories", categories.size());
            
            List<Map<String, Object>> categoryResponses = categories.stream()
                    .map(this::createCategoryResponseWithCount)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(categoryResponses);
            
        } catch (Exception e) {
            logger.error("Error fetching categories", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    

    
    /**
     * Get category by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(id);
            
            if (categoryOpt.isPresent()) {
                return ResponseEntity.ok(createCategoryResponse(categoryOpt.get()));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Category not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching category by ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Update category
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @Valid @RequestBody CreateCategoryRequest request) {
        try {
            Category category = categoryService.updateCategory(
                    id,
                    request.getName(),
                    request.getDescription(),
                    request.getColor()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Category updated successfully");
            response.put("category", createCategoryResponse(category));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error updating category with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Delete category
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            boolean deleted = categoryService.deleteCategory(id);
            
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Category deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Category not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error deleting category with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Simple test endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Test endpoint working");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * Simple count endpoint to check if categories exist
     */
    @GetMapping("/admin/count")
    public ResponseEntity<?> getCategoryCount() {
        try {
            List<Category> allCategories = categoryService.getAllCategories();
            Map<String, Object> response = new HashMap<>();
            response.put("totalCategories", allCategories.size());
            response.put("message", "Total categories in database: " + allCategories.size());
            logger.info("Category count endpoint: Found {} categories", allCategories.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting category count", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Debug endpoint to check raw categories
     */
    @GetMapping("/admin/debug")
    public ResponseEntity<?> debugCategories() {
        try {
            logger.info("Debug: Checking raw categories");
            List<Category> allCategories = categoryService.getAllCategories();
            logger.info("Debug: Found {} raw categories", allCategories.size());
            
            List<Category> categoriesWithCounts = categoryService.getAllCategoriesWithPhotoCounts();
            logger.info("Debug: Found {} categories with counts", categoriesWithCounts.size());
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("rawCategoriesCount", allCategories.size());
            debugInfo.put("categoriesWithCountsCount", categoriesWithCounts.size());
            debugInfo.put("rawCategories", allCategories.stream()
                    .map(this::createCategoryResponse)
                    .collect(Collectors.toList()));
            debugInfo.put("categoriesWithCounts", categoriesWithCounts.stream()
                    .map(this::createCategoryResponseWithCount)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(debugInfo);
            
        } catch (Exception e) {
            logger.error("Error in debug endpoint", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Debug error: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get photos by category ID
     */
    @GetMapping("/{categoryId}/photos")
    public ResponseEntity<?> getPhotosByCategory(@PathVariable Long categoryId) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryByIdWithPhotos(categoryId);
            
            if (categoryOpt.isPresent()) {
                Category category = categoryOpt.get();
                List<Map<String, Object>> photoResponses = category.getPhotos().stream()
                        .map(this::createPhotoResponseWithStats)
                        .collect(Collectors.toList());
                
                return ResponseEntity.ok(photoResponses);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Category not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching photos for category ID: {}", categoryId, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper methods
    private Map<String, Object> createCategoryResponse(Category category) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", category.getId());
        response.put("name", category.getName());
        response.put("description", category.getDescription());
        response.put("color", category.getColor());
        response.put("createdAt", category.getCreatedAt());
        response.put("updatedAt", category.getUpdatedAt());
        return response;
    }
    
    private Map<String, Object> createCategoryResponseWithCount(Category category) {
        Map<String, Object> response = createCategoryResponse(category);
        response.put("photoCount", category.getPhotoCount() != null ? category.getPhotoCount() : 0);
        return response;
    }
    
    private Map<String, Object> createPhotoResponseWithStats(Photo photo) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", photo.getId());
        response.put("filename", photo.getFilename());
        response.put("originalName", photo.getOriginalName());
        response.put("caption", photo.getCaption());
        response.put("createdAt", photo.getCreatedAt());
        response.put("uploader", photo.getUploader() != null ? 
                Map.of("name", photo.getUploader().getName()) : null);
        response.put("categories", photo.getCategories().stream()
                .map(cat -> Map.of("id", cat.getId(), "name", cat.getName(), "color", cat.getColor()))
                .collect(Collectors.toList()));
        response.put("noteCount", photo.getNotes().size());
        response.put("isFavorite", photo.getIsFavorite() != null ? photo.getIsFavorite() : false);
        return response;
    }
    
    // Request DTO
    public static class CreateCategoryRequest {
        private String name;
        private String description;
        private String color = "#3B82F6"; // Default blue color
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }
}
