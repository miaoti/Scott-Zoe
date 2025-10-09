package com.couplewebsite.repository;

import com.couplewebsite.entity.EditSession;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EditSessionRepository extends JpaRepository<EditSession, Long> {
    
    Optional<EditSession> findByNoteIdAndIsActiveTrue(Long noteId);
    
    Optional<EditSession> findByNoteId(Long noteId);
    
    @Modifying
    @Query("UPDATE EditSession e SET e.isActive = false, e.currentEditor = null, e.lastActivityAt = :now WHERE e.isActive = true AND e.lastActivityAt < :expiredTime")
    int deactivateExpiredSessions(@Param("expiredTime") LocalDateTime expiredTime, @Param("now") LocalDateTime now);
    
    @Modifying
    @Query("UPDATE EditSession e SET e.requestedByUser = null, e.requestExpiresAt = null WHERE e.requestExpiresAt < :now")
    int clearExpiredRequests(@Param("now") LocalDateTime now);
    
    @Query("SELECT e FROM EditSession e WHERE e.noteId = :noteId AND e.currentEditor.id = :userId AND e.isActive = true")
    Optional<EditSession> findActiveSessionByNoteAndUser(@Param("noteId") Long noteId, @Param("userId") Long userId);
}