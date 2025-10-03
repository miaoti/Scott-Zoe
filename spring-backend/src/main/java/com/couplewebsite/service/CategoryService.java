package com.couplewebsite.service;

import com.couplewebsite.entity.Category;
import com.couplewebsite.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {
    
    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    /**
     * Create a new category
     */
    public Category createCategory(String name, String description, String color) {
        try {
            // Check if category name already exists
            if (categoryRepository.existsByNameIgnoreCase(name)) {
                throw new RuntimeException("Category with name '" + name + "' already exists");
            }
            
            Category category = new Category(name, description, color);
            Category savedCategory = categoryRepository.save(category);
            
            logger.info("Category created successfully: {}", name);
            return savedCategory;
            
        } catch (Exception e) {
            logger.error("Error creating category", e);
            throw new RuntimeException("Failed to create category: " + e.getMessage());
        }
    }
    
    /**
     * Get all categories
     */
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc();
    }
    
    /**
     * Get all categories with photo counts
     */
    public List<Category> getAllCategoriesWithPhotoCounts() {
        List<Object[]> results = categoryRepository.findAllWithPhotoCounts();
        
        return results.stream().map(result -> {
            Category category = (Category) result[0];
            Long photoCount = (Long) result[1];
            category.setPhotoCount(photoCount);
            return category;
        }).collect(Collectors.toList());
    }
    
    /**
     * Get category by ID
     */
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    /**
     * Get category by ID with photos
     */
    public Optional<Category> getCategoryByIdWithPhotos(Long id) {
        return categoryRepository.findByIdWithPhotos(id);
    }
    
    /**
     * Get category by ID with photos (simplified version for testing)
     */
    public Optional<Category> getCategoryByIdWithPhotosSimple(Long id) {
        return categoryRepository.findByIdWithPhotosSimple(id);
    }
    
    /**
     * Get category by ID with all photos (most basic version for testing)
     */
    public Optional<Category> getCategoryByIdWithAllPhotos(Long id) {
        return categoryRepository.findByIdWithAllPhotos(id);
    }
    
    /**
     * Update category
     */
    public Category updateCategory(Long id, String name, String description, String color) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        // Check if new name conflicts with existing category (excluding current one)
        Optional<Category> existingCategory = categoryRepository.findByNameIgnoreCase(name);
        if (existingCategory.isPresent() && !existingCategory.get().getId().equals(id)) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }
        
        category.setName(name);
        category.setDescription(description);
        category.setColor(color);
        
        return categoryRepository.save(category);
    }
    
    /**
     * Delete category
     */
    public boolean deleteCategory(Long id) {
        try {
            Optional<Category> categoryOpt = categoryRepository.findById(id);
            if (categoryOpt.isPresent()) {
                Category category = categoryOpt.get();
                
                // Remove category from all associated photos
                category.getPhotos().forEach(photo -> photo.removeCategory(category));
                
                // Delete the category
                categoryRepository.delete(category);
                
                logger.info("Category deleted successfully: {}", category.getName());
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error deleting category with ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * Find category by name (case-insensitive)
     */
    public Optional<Category> findByName(String name) {
        return categoryRepository.findByNameIgnoreCase(name);
    }
}
