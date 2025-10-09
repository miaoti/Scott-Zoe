package com.couplewebsite.controller;

import com.couplewebsite.dto.EditControlMessage;
import com.couplewebsite.entity.EditSession;
import com.couplewebsite.entity.User;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.service.EditControlService;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.SharedNoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/edit-control")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class EditControlController {
    
    private static final Logger logger = LoggerFactory.getLogger(EditControlController.class);
    
    @Autowired
    private EditControlService editControlService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private SharedNoteService sharedNoteService;
    
    /**
     * Get current edit session status for a note
     */
    @GetMapping("/status/{noteId}")
    public ResponseEntity<Map<String, Object>> getEditStatus(@PathVariable Long noteId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            
            User user = userService.findByUsername(principal.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            Optional<EditSession> sessionOpt = editControlService.getActiveEditSession(noteId);
            boolean hasEditPermission = editControlService.hasEditPermission(user.getId(), noteId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("noteId", noteId);
            response.put("hasEditPermission", hasEditPermission);
            response.put("userId", user.getId());
            
            if (sessionOpt.isPresent()) {
                EditSession session = sessionOpt.get();
                response.put("isLocked", true);
                response.put("currentEditor", Map.of(
                    "id", session.getCurrentEditor().getId(),
                    "username", session.getCurrentEditor().getUsername()
                ));
                response.put("lockAcquiredAt", session.getLockAcquiredAt());
                response.put("lastActivityAt", session.getLastActivityAt());
            } else {
                response.put("isLocked", false);
                response.put("currentEditor", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting edit status for note {}", noteId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
    
    /**
     * Request edit control for a note
     */
    @PostMapping("/request/{noteId}")
    public ResponseEntity<Map<String, Object>> requestEditControl(@PathVariable Long noteId, 
                                                                 @RequestBody Map<String, String> payload,
                                                                 Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            
            User user = userService.findByUsername(principal.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            String sessionId = payload.get("sessionId");
            if (sessionId == null || sessionId.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Session ID is required"));
            }
            
            // Update user session
            editControlService.createOrUpdateUserSession(user.getId(), sessionId);
            
            // Request edit control
            Optional<EditSession> sessionOpt = editControlService.requestEditControl(noteId, user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("noteId", noteId);
            response.put("userId", user.getId());
            
            if (sessionOpt.isPresent()) {
                EditSession session = sessionOpt.get();
                response.put("granted", true);
                response.put("message", "Edit control granted");
                response.put("session", Map.of(
                    "id", session.getId(),
                    "currentEditor", Map.of(
                        "id", session.getCurrentEditor().getId(),
                        "username", session.getCurrentEditor().getUsername()
                    ),
                    "lockAcquiredAt", session.getLockAcquiredAt()
                ));
                
                logger.info("Granted edit control to user: {} for note: {}", user.getUsername(), noteId);
            } else {
                response.put("granted", false);
                response.put("message", "Another user is currently editing");
                
                // Get current editor info
                Optional<EditSession> currentSessionOpt = editControlService.getActiveEditSession(noteId);
                if (currentSessionOpt.isPresent()) {
                    EditSession currentSession = currentSessionOpt.get();
                    response.put("currentEditor", Map.of(
                        "id", currentSession.getCurrentEditor().getId(),
                        "username", currentSession.getCurrentEditor().getUsername()
                    ));
                }
                
                logger.info("Denied edit control to user: {} for note: {} (already in use)", user.getUsername(), noteId);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error requesting edit control for note {}", noteId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
    
    /**
     * Release edit control for a note
     */
    @PostMapping("/release/{noteId}")
    public ResponseEntity<Map<String, Object>> releaseEditControl(@PathVariable Long noteId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            
            User user = userService.findByUsername(principal.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            editControlService.releaseEditControl(noteId, user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("noteId", noteId);
            response.put("userId", user.getId());
            response.put("released", true);
            response.put("message", "Edit control released");
            
            logger.info("Released edit control from user: {} for note: {}", user.getUsername(), noteId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error releasing edit control for note {}", noteId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
    
    /**
     * Update note content (only allowed if user has edit control)
     */
    @PutMapping("/content/{noteId}")
    public ResponseEntity<Map<String, Object>> updateContent(@PathVariable Long noteId,
                                                            @RequestBody Map<String, Object> payload,
                                                            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            
            User user = userService.findByUsername(principal.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            // Verify user has edit permission
            if (!editControlService.hasEditPermission(user.getId(), noteId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No edit permission"));
            }
            
            String content = (String) payload.get("content");
            if (content == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Content is required"));
            }
            
            // Update the note content
            SharedNote note = sharedNoteService.updateNoteContent(noteId, content);
            
            // Update activity
            editControlService.updateActivity(noteId, user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("noteId", noteId);
            response.put("content", note.getContent());
            response.put("updatedAt", note.getUpdatedAt());
            response.put("updatedBy", user.getUsername());
            
            logger.info("Updated content for note: {} by user: {}", noteId, user.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating content for note {}", noteId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
    
    /**
     * Get note content
     */
    @GetMapping("/content/{noteId}")
    public ResponseEntity<Map<String, Object>> getContent(@PathVariable Long noteId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            
            User user = userService.findByUsername(principal.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            SharedNote note = sharedNoteService.findById(noteId);
            if (note == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Note not found"));
            }
            
            boolean hasEditPermission = editControlService.hasEditPermission(user.getId(), noteId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("noteId", noteId);
            response.put("content", note.getContent());
            response.put("updatedAt", note.getUpdatedAt());
            response.put("hasEditPermission", hasEditPermission);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting content for note {}", noteId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}