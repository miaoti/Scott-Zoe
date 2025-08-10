package com.couplewebsite.repository;

import com.couplewebsite.entity.Photo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    
    /**
     * Find all photos with pagination, ordered by creation date descending
     */
    Page<Photo> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Find photo by ID with uploader, notes, and categories
     */
    @Query("SELECT p FROM Photo p " +
           "LEFT JOIN FETCH p.uploader " +
           "LEFT JOIN FETCH p.notes n " +
           "LEFT JOIN FETCH n.author " +
           "LEFT JOIN FETCH p.categories " +
           "WHERE p.id = :id")
    Optional<Photo> findByIdWithDetails(@Param("id") Long id);
    
    /**
     * Find photos by uploader
     */
    Page<Photo> findByUploaderIdOrderByCreatedAtDesc(Long uploaderId, Pageable pageable);
    
    /**
     * Find photos by category
     */
    @Query("SELECT p FROM Photo p JOIN p.categories c WHERE c.id = :categoryId ORDER BY p.createdAt DESC")
    Page<Photo> findByCategoryIdOrderByCreatedAtDesc(@Param("categoryId") Long categoryId, Pageable pageable);
    
    /**
     * Count photos by uploader
     */
    long countByUploaderId(Long uploaderId);

    /**
     * Find all favorite photos
     */
    List<Photo> findByIsFavoriteTrue();
}
