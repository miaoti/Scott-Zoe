package com.couplewebsite.service;

import com.couplewebsite.entity.EditSession;
import com.couplewebsite.entity.User;
import com.couplewebsite.entity.UserSession;
import com.couplewebsite.repository.EditSessionRepository;
import com.couplewebsite.repository.UserSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class EditControlService {
    
    private static final Logger logger = LoggerFactory.getLogger(EditControlService.class);
    
    @Autowired
    private EditSessionRepository editSessionRepository;
    
    @Autowired
    private UserSessionRepository userSessionRepository;
    
    /**
     * Request edit control for a note
     */
    public EditSession requestEditControl(Long noteId, User user) {
        logger.info("User {} requesting edit control for note {}", user.getId(), noteId);
        
        EditSession session = editSessionRepository.findByNoteId(noteId)
            .orElse(new EditSession(noteId));
        
        // If no one is currently editing, grant immediately
        if (!session.getIsActive() || session.getCurrentEditor() == null) {
            return grantEditControl(noteId, user);
        }
        
        // If the same user is already editing, return current session
        if (session.getCurrentEditor().getId().equals(user.getId())) {
            session.setLastActivityAt(LocalDateTime.now());
            return editSessionRepository.save(session);
        }
        
        // Set request for edit control
        session.setRequestedByUser(user);
        session.setRequestExpiresAt(LocalDateTime.now().plusSeconds(30));
        
        return editSessionRepository.save(session);
    }
    
    /**
     * Grant edit control to a user
     */
    public EditSession grantEditControl(Long noteId, User user) {
        logger.info("Granting edit control to user {} for note {}", user.getId(), noteId);
        
        EditSession session = editSessionRepository.findByNoteId(noteId)
            .orElse(new EditSession(noteId));
        
        LocalDateTime now = LocalDateTime.now();
        session.setCurrentEditor(user);
        session.setIsActive(true);
        session.setLockAcquiredAt(now);
        session.setLastActivityAt(now);
        session.setRequestedByUser(null);
        session.setRequestExpiresAt(null);
        
        return editSessionRepository.save(session);
    }
    
    /**
     * Release edit control
     */
    public EditSession releaseEditControl(Long noteId, User user) {
        logger.info("User {} releasing edit control for note {}", user.getId(), noteId);
        
        Optional<EditSession> sessionOpt = editSessionRepository.findByNoteId(noteId);
        if (sessionOpt.isEmpty()) {
            return null;
        }
        
        EditSession session = sessionOpt.get();
        
        // Only the current editor can release control
        if (session.getCurrentEditor() != null && session.getCurrentEditor().getId().equals(user.getId())) {
            session.setCurrentEditor(null);
            session.setIsActive(false);
            session.setLastActivityAt(LocalDateTime.now());
            return editSessionRepository.save(session);
        }
        
        return session;
    }
    
    /**
     * Update activity timestamp for current editor
     */
    public void updateActivity(Long noteId, User user) {
        Optional<EditSession> sessionOpt = editSessionRepository.findActiveSessionByNoteAndUser(noteId, user.getId());
        if (sessionOpt.isPresent()) {
            EditSession session = sessionOpt.get();
            session.setLastActivityAt(LocalDateTime.now());
            editSessionRepository.save(session);
        }
    }
    
    /**
     * Get current edit session for a note
     */
    public Optional<EditSession> getCurrentEditSession(Long noteId) {
        return editSessionRepository.findByNoteId(noteId);
    }
    
    /**
     * Check if user can edit the note
     */
    public boolean canUserEdit(Long noteId, User user) {
        Optional<EditSession> sessionOpt = editSessionRepository.findByNoteIdAndIsActiveTrue(noteId);
        if (sessionOpt.isEmpty()) {
            return true; // No active session, anyone can edit
        }
        
        EditSession session = sessionOpt.get();
        return session.getCurrentEditor() != null && session.getCurrentEditor().getId().equals(user.getId());
    }
    
    /**
     * Create or update user session
     */
    public UserSession createOrUpdateUserSession(User user, String sessionId) {
        Optional<UserSession> existingSession = userSessionRepository.findBySessionId(sessionId);
        
        if (existingSession.isPresent()) {
            UserSession session = existingSession.get();
            session.setIsConnected(true);
            session.updatePing();
            return userSessionRepository.save(session);
        } else {
            UserSession newSession = new UserSession(user, sessionId);
            return userSessionRepository.save(newSession);
        }
    }
    
    /**
     * Update user session ping
     */
    public void updateUserSessionPing(String sessionId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.updatePing();
            userSessionRepository.save(session);
        }
    }
    
    /**
     * Mark user session as disconnected
     */
    public void disconnectUserSession(String sessionId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.setIsConnected(false);
            userSessionRepository.save(session);
        }
    }
    
    /**
     * Scheduled cleanup of expired sessions and requests
     */
    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredTime = now.minusMinutes(2);
        LocalDateTime disconnectedTime = now.minusSeconds(30);
        LocalDateTime cleanupTime = now.minusHours(24);
        
        // Deactivate expired edit sessions
        int expiredSessions = editSessionRepository.deactivateExpiredSessions(expiredTime, now);
        if (expiredSessions > 0) {
            logger.info("Deactivated {} expired edit sessions", expiredSessions);
        }
        
        // Clear expired edit requests
        int expiredRequests = editSessionRepository.clearExpiredRequests(now);
        if (expiredRequests > 0) {
            logger.info("Cleared {} expired edit requests", expiredRequests);
        }
        
        // Mark disconnected user sessions
        int disconnectedSessions = userSessionRepository.markDisconnectedSessions(disconnectedTime);
        if (disconnectedSessions > 0) {
            logger.info("Marked {} user sessions as disconnected", disconnectedSessions);
        }
        
        // Clean up old disconnected sessions
        int cleanedSessions = userSessionRepository.deleteOldDisconnectedSessions(cleanupTime);
        if (cleanedSessions > 0) {
            logger.info("Cleaned up {} old disconnected sessions", cleanedSessions);
        }
    }
}