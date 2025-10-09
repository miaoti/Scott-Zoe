package com.couplewebsite.controller;

import com.couplewebsite.dto.NoteOperationDto;
import com.couplewebsite.dto.WindowPositionDto;
import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WindowPosition;
import com.couplewebsite.service.SharedNoteService;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.WindowPositionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class SharedNoteWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(SharedNoteWebSocketController.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private SharedNoteService sharedNoteService;
    
    @Autowired
    private WindowPositionService windowPositionService;
    
    @Autowired
    private UserService userService;
    
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
            
            // Send current note content to the subscribing user
            SharedNote currentNote = sharedNoteService.getCurrentSharedNote();
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
     * Handle note operation (insert, delete, retain)
     */
    @MessageMapping("/shared-note/operation")
    public void handleNoteOperation(@Payload NoteOperationDto operationDto, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for note operation");
                return;
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                return;
            }
            
            // Get current shared note
            SharedNote sharedNote = sharedNoteService.getCurrentSharedNote();
            
            // Save the operation
            NoteOperation operation = sharedNoteService.saveNoteOperation(
                sharedNote, user, operationDto.getOperationType(), 
                operationDto.getPosition(), operationDto.getContent(), 
                operationDto.getLength()
            );
            
            // Apply operation to note content
            String updatedContent = sharedNoteService.applyOperation(sharedNote, operation);
            
            // Broadcast operation to all connected users except sender
            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("type", "OPERATION");
            broadcast.put("operation", convertToDto(operation));
            broadcast.put("content", updatedContent);
            broadcast.put("userId", user.getId());
            broadcast.put("username", username);
            broadcast.put("timestamp", LocalDateTime.now());
            
            messagingTemplate.convertAndSend("/topic/shared-note/operations", broadcast);
            
            logger.info("Processed note operation from user {}: {} at position {}", 
                username, operationDto.getOperationType(), operationDto.getPosition());
            
        } catch (Exception e) {
            logger.error("Error handling note operation", e);
        }
    }
    
    /**
     * Handle cursor position updates
     */
    @MessageMapping("/shared-note/cursor")
    public void handleCursorPosition(@Payload Map<String, Object> payload, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for cursor update");
                return;
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                return;
            }
            
            // Broadcast cursor position to all users except sender
            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("type", "CURSOR_POSITION");
            broadcast.put("userId", user.getId());
            broadcast.put("username", username);
            broadcast.put("position", payload.get("position"));
            broadcast.put("timestamp", LocalDateTime.now());
            
            messagingTemplate.convertAndSend("/topic/shared-note/cursors", broadcast);
            
        } catch (Exception e) {
            logger.error("Error handling cursor position update", e);
        }
    }
    
    /**
     * Handle typing indicator
     */
    @MessageMapping("/shared-note/typing")
    public void handleTypingIndicator(@Payload Map<String, Object> payload, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for typing indicator");
                return;
            }
            
            String username = principal.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                return;
            }
            
            // Broadcast typing status to all users except sender
            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("type", "TYPING_STATUS");
            broadcast.put("userId", user.getId());
            broadcast.put("username", username);
            broadcast.put("isTyping", payload.get("isTyping"));
            broadcast.put("timestamp", LocalDateTime.now());
            
            messagingTemplate.convertAndSend("/topic/shared-note/typing", broadcast);
            
        } catch (Exception e) {
            logger.error("Error handling typing indicator", e);
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
                user, positionDto.getXPosition(), positionDto.getYPosition(),
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
        } else {
            logger.warn("Ping received from unauthenticated user");
        }
        
        return response;
    }
    
    /**
     * Convert NoteOperation entity to DTO
     */
    private NoteOperationDto convertToDto(NoteOperation operation) {
        return new NoteOperationDto(
            operation.getId(),
            operation.getNote().getId(),
            operation.getUser().getId(),
            operation.getOperationType(),
            operation.getPosition(),
            operation.getContent(),
            operation.getLength(),
            operation.getCreatedAt(),
            operation.getSequenceNumber()
        );
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