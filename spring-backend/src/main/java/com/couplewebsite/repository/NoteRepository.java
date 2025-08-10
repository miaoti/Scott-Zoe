package com.couplewebsite.repository;

import com.couplewebsite.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    
    /**
     * Find notes by photo ID ordered by creation date
     */
    @Query("SELECT n FROM Note n LEFT JOIN FETCH n.author WHERE n.photo.id = :photoId ORDER BY n.createdAt ASC")
    List<Note> findByPhotoIdWithAuthorOrderByCreatedAtAsc(@Param("photoId") Long photoId);
    
    /**
     * Find note by ID with author details
     */
    @Query("SELECT n FROM Note n LEFT JOIN FETCH n.author WHERE n.id = :id")
    Optional<Note> findByIdWithAuthor(@Param("id") Long id);
    
    /**
     * Find notes by author
     */
    List<Note> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    /**
     * Count notes by photo
     */
    long countByPhotoId(Long photoId);
    
    /**
     * Count notes by author
     */
    long countByAuthorId(Long authorId);
}
