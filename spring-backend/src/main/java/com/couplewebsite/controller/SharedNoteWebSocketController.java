package com.couplewebsite.controller;

import com.couplewebsite.dto.EditControlMessage;
import com.couplewebsite.dto.WindowPositionDto;
import com.couplewebsite.entity.EditSession;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WindowPosition;
import com.couplewebsite.service.EditControlService;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.WindowPositionService;
import com.couplewebsite.repository.SharedNoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.context.event.EventListener;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
public class SharedNoteWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(SharedNoteWebSocketController.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private SharedNoteRepository sharedNoteRepository;
    
    @Autowired
    private WindowPositionService windowPositionService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private EditControlService editControlService;
    
    /**
     * Handle subscription to shared note updates
     */
    @MessageMapping("/shared-note/subscribe")
    public void subscribeToUpdates(@Payload Map<String, Object> payload, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for WebSocket subscription");
                return;
            }
            
            String username = principal.getName();
            logger.info("User {} subscribed to shared note updates", username);
            
            // Get current note
            SharedNote currentNote = getOrCreateSharedNote();
            
            Map<String, Object> response = new HashMap<>();
            response.put("type", "INITIAL_CONTENT");
            response.put("content", currentNote.getContent());
            response.put("noteId", currentNote.getId());
            response.put("timestamp", LocalDateTime.now());
            
            String userDestination = "/user/" + username + "/queue/shared-note/updates";
            messagingTemplate.convertAndSend(userDestination, response);
            
        } catch (Exception e) {
            logger.error("Error handling shared note subscription", e);
        }
    }
    
    /**
     * Handle window position updates
     */
    @MessageMapping("/shared-note/window-position")
    public void handleWindowPosition(@Payload WindowPositionDto positionDto, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for window position update");
                return;
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                return;
            }
            
            // Update window position
            WindowPosition position = windowPositionService.updateWindowPosition(
                user.getId(), positionDto.getXPosition(), positionDto.getYPosition(),
                positionDto.getWidth(), positionDto.getHeight()
            );
            
            logger.info("Updated window position for user {}: ({}, {}) {}x{}", 
                username, position.getXPosition(), position.getYPosition(),
                position.getWidth(), position.getHeight());
            
        } catch (Exception e) {
            logger.error("Error handling window position update", e);
        }
    }
    
    /**
     * Handle edit control messages (REQUEST_EDIT_CONTROL, RELEASE_EDIT_CONTROL, etc.)
     */
    @MessageMapping("/shared-note/edit-control")
    public void handleEditControl(@Payload EditControlMessage message, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for edit control");
                return;
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                return;
            }
            
            logger.info("Handling edit control message: {} from user: {}", message.getType(), username);
            
            switch (message.getType()) {
                case EditControlMessage.REQUEST_EDIT_CONTROL:
                    handleRequestEditControl(message, user);
                    break;
                case EditControlMessage.RELEASE_EDIT_CONTROL:
                    handleReleaseEditControl(message, user);
                    break;
                case EditControlMessage.CONTENT_UPDATE:
                    handleContentUpdate(message, user);
                    break;
                case EditControlMessage.TYPING_STATUS:
                    handleTypingStatus(message, user);
                    break;
                default:
                    logger.warn("Unknown edit control message type: {}", message.getType());
            }
            
        } catch (Exception e) {
            logger.error("Error handling edit control message", e);
        }
    }
    
    private void handleRequestEditControl(EditControlMessage message, User user) {
        try {
            // Create or update user session
            editControlService.createOrUpdateUserSession(user.getId(), message.getSessionId());
            
            // Request edit control
            Optional<EditSession> sessionOpt = editControlService.requestEditControl(message.getNoteId(), user);
            
            if (sessionOpt.isPresent()) {
                EditSession session = sessionOpt.get();
                if (session.getCurrentEditor() != null && session.getCurrentEditor().getId().equals(user.getId())) {
                // Send grant message to requesting user
                EditControlMessage grantMessage = EditControlMessage.editControlGranted(
                    user.getId(), message.getNoteId(), message.getSessionId()
                );
                messagingTemplate.convertAndSendToUser(
                    user.getUsername(), "/queue/shared-note/edit-control", grantMessage
                );
                
                // Notify other users that edit control has been granted
                EditControlMessage notifyMessage = EditControlMessage.editControlGranted(
                    user.getId(), message.getNoteId(), message.getSessionId()
                );
                notifyMessage.setUserName(user.getUsername()); // Add username to the message
                messagingTemplate.convertAndSend("/topic/shared-note/edit-control", notifyMessage);
                
                    logger.info("Granted edit control to user: {} for note: {}", user.getUsername(), message.getNoteId());
                } else {
                    // Edit control denied (someone else is editing)
                    EditControlMessage denyMessage = EditControlMessage.denyEditControl(
                        user.getId(), message.getNoteId(), "Another user is currently editing"
                    );
                    messagingTemplate.convertAndSendToUser(
                        user.getUsername(), "/queue/shared-note/edit-control", denyMessage
                    );
                    
                    logger.info("Denied edit control to user: {} for note: {} (already in use)", user.getUsername(), message.getNoteId());
                }
            } else {
                // Request is pending
                logger.info("Edit control request pending for user: {} for note: {}", user.getUsername(), message.getNoteId());
            }
            
        } catch (Exception e) {
            logger.error("Error handling request edit control", e);
        }
    }
    
    private void handleReleaseEditControl(EditControlMessage message, User user) {
        try {
            editControlService.releaseEditControl(message.getNoteId(), user);
            
            // Notify all users that edit control has been released
            EditControlMessage releaseMessage = EditControlMessage.editControlReleased(
                user.getId(), message.getNoteId()
            );
            releaseMessage.setUserName(user.getUsername()); // Add username to the message
            messagingTemplate.convertAndSend("/topic/shared-note/edit-control", releaseMessage);
            
            logger.info("Released edit control from user: {} for note: {}", user.getUsername(), message.getNoteId());
            
        } catch (Exception e) {
            logger.error("Error handling release edit control", e);
        }
    }
    
    private void handleContentUpdate(EditControlMessage message, User user) {
        try {
            // Verify user has edit permission
            if (!editControlService.canUserEdit(user.getId(), message.getNoteId())) {
                logger.warn("User {} attempted to update content without edit permission for note {}", 
                    user.getUsername(), message.getNoteId());
                return;
            }
            
            // Update the shared note content
            SharedNote note = sharedNoteRepository.findById(message.getNoteId())
                .orElseThrow(() -> new RuntimeException("Shared note not found"));
            
            note.setContent(message.getContent());
            sharedNoteRepository.save(note);
            
            // Update activity
            editControlService.updateActivity(message.getNoteId(), user.getId());
            
            // Broadcast content update to all users except sender
            EditControlMessage updateMessage = EditControlMessage.contentUpdate(
                message.getNoteId(), user.getId(), message.getContent(), message.getCursorPosition()
            );
            messagingTemplate.convertAndSend("/topic/shared-note/content", updateMessage);
            
            logger.debug("Broadcasted content update from user: {} for note: {}", user.getUsername(), message.getNoteId());
            
        } catch (Exception e) {
            logger.error("Error handling content update", e);
        }
    }
    
    private void handleTypingStatus(EditControlMessage message, User user) {
        try {
            // Verify user has edit permission
            if (!editControlService.canUserEdit(user.getId(), message.getNoteId())) {
                return;
            }
            
            // Update activity
            editControlService.updateActivity(message.getNoteId(), user.getId());
            
            // Broadcast typing status to all users except sender
            EditControlMessage typingMessage = EditControlMessage.typingStatus(
                user.getId(), message.getNoteId(), user.getUsername(), message.getIsTyping()
            );
            messagingTemplate.convertAndSend("/topic/shared-note/typing", typingMessage);
            
            logger.debug("Broadcasted typing status from user: {} for note: {}", user.getUsername(), message.getNoteId());
            
        } catch (Exception e) {
            logger.error("Error handling typing status", e);
        }
    }
    
    /**
     * Handle user connection events
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            Principal principal = headerAccessor.getUser();
            
            if (principal != null) {
                User user = userService.findByUsername(principal.getName());
                if (user != null) {
                    editControlService.createUserSession(user.getId(), sessionId);
                    logger.info("User {} connected with session {}", principal.getName(), sessionId);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error handling WebSocket connect event", e);
        }
    }
    
    /**
     * Handle user disconnection events
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            Principal principal = headerAccessor.getUser();
            
            if (principal != null) {
                User user = userService.findByUsername(principal.getName());
                if (user != null) {
                    editControlService.disconnectUserSession(sessionId);
                    logger.info("User {} disconnected with session {}", principal.getName(), sessionId);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error handling WebSocket disconnect event", e);
        }
    }
    
    /**
     * Handle heartbeat/ping messages
     */
    @MessageMapping("/shared-note/ping")
    @SendToUser("/queue/shared-note/pong")
    public Map<String, Object> handlePing(@Payload Map<String, Object> payload, Principal principal) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "PONG");
        response.put("timestamp", LocalDateTime.now());
        
        if (principal != null) {
            response.put("user", principal.getName());
            logger.debug("Ping received from user: {}", principal.getName());
            
            // Update user session ping
            try {
                User user = userService.findByUsername(principal.getName());
                if (user != null && payload.containsKey("sessionId")) {
                    editControlService.createOrUpdateUserSession(user.getId(), (String) payload.get("sessionId"));
                }
            } catch (Exception e) {
                logger.error("Error updating user session ping", e);
            }
        } else {
            logger.warn("Ping received from unauthenticated user");
        }
        
        return response;
    }
    
    /**
     * Get or create shared note
     */
    private SharedNote getOrCreateSharedNote() {
        Optional<SharedNote> existingNote = sharedNoteRepository.findCurrentSharedNote();
        if (existingNote.isPresent()) {
            return existingNote.get();
        }
        
        // Create default shared note if none exists
        SharedNote newNote = new SharedNote();
        newNote.setContent("Welcome to your shared notes! Start typing here...");
        return sharedNoteRepository.save(newNote);
    }
    
    /**
     * Send synchronization request to all connected users
     */
    public void requestSynchronization() {
        try {
            Map<String, Object> syncRequest = new HashMap<>();
            syncRequest.put("type", "SYNC_REQUEST");
            syncRequest.put("timestamp", LocalDateTime.now());
            
            messagingTemplate.convertAndSend("/topic/shared-note/sync", syncRequest);
            
            logger.info("Sent synchronization request to all connected users");
            
        } catch (Exception e) {
            logger.error("Error sending synchronization request", e);
        }
    }
    
    /**
     * Send content synchronization to all users
     */
    public void synchronizeContent(String content, Long noteId) {
        try {
            Map<String, Object> syncData = new HashMap<>();
            syncData.put("type", "CONTENT_SYNC");
            syncData.put("content", content);
            syncData.put("noteId", noteId);
            syncData.put("timestamp", LocalDateTime.now());
            
            messagingTemplate.convertAndSend("/topic/shared-note/sync", syncData);
            
            logger.info("Synchronized content to all connected users for note {}", noteId);
            
        } catch (Exception e) {
            logger.error("Error synchronizing content", e);
        }
    }
}