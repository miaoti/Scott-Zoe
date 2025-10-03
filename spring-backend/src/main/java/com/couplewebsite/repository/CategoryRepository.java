package com.couplewebsite.repository;

import com.couplewebsite.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    /**
     * Find all categories ordered by name
     */
    List<Category> findAllByOrderByNameAsc();
    
    /**
     * Find category by name (case-insensitive)
     */
    @Query("SELECT c FROM Category c WHERE LOWER(c.name) = LOWER(:name)")
    Optional<Category> findByNameIgnoreCase(@Param("name") String name);
    
    /**
     * Check if category name exists (case-insensitive)
     */
    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE LOWER(c.name) = LOWER(:name)")
    boolean existsByNameIgnoreCase(@Param("name") String name);
    
    /**
     * Find category by ID with photos (excluding deleted photos)
     */
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.photos p LEFT JOIN FETCH p.uploader WHERE c.id = :id AND (p IS NULL OR p.isDeleted = false)")
    Optional<Category> findByIdWithPhotos(@Param("id") Long id);
    
    /**
     * Simplified version without uploader fetch to test for issues
     */
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.photos p WHERE c.id = :id AND (p IS NULL OR p.isDeleted = false)")
    Optional<Category> findByIdWithPhotosSimple(@Param("id") Long id);
    
    /**
     * Most basic version - just get category with all photos (no filtering)
     */
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.photos WHERE c.id = :id")
    Optional<Category> findByIdWithAllPhotos(@Param("id") Long id);
    
    /**
     * Find categories with photo counts (excluding deleted photos)
     */
    @Query("SELECT c, COUNT(CASE WHEN p.isDeleted = false THEN p.id END) as photoCount FROM Category c LEFT JOIN c.photos p GROUP BY c ORDER BY c.name ASC")
    List<Object[]> findAllWithPhotoCounts();
}
