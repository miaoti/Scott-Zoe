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
            
            // Get current note and synchronize content from all operations
            SharedNote currentNote = sharedNoteService.getCurrentSharedNote();
            
            // Ensure content is synchronized from all operations
            SharedNote synchronizedNote = sharedNoteService.synchronizeContent(currentNote.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("type", "INITIAL_CONTENT");
            response.put("content", synchronizedNote.getContent());
            response.put("noteId", synchronizedNote.getId());
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
            logger.info("=== BACKEND handleNoteOperation DEBUG START ===");
            logger.info("Received operation: type={}, position={}, content='{}', length={}, clientId={}", 
                operationDto.getOperationType(), operationDto.getPosition(), 
                operationDto.getContent(), operationDto.getLength(), operationDto.getClientId());
            
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
            
            logger.info("Processing operation for user: {} (ID: {})", username, user.getId());
            
            // Get current shared note
            SharedNote sharedNote = sharedNoteService.getCurrentSharedNote();
            logger.info("Current shared note content before operation: '{}'", sharedNote.getContent());
            
            // Save the operation
            NoteOperation operation = sharedNoteService.saveNoteOperation(
                sharedNote, user, operationDto.getOperationType(), 
                operationDto.getPosition(), operationDto.getContent(), 
                operationDto.getLength()
            );
            
            logger.info("Saved operation with ID: {}, sequenceNumber: {}", 
                operation.getId(), operation.getSequenceNumber());
            
            // Apply operation to note content
            SharedNote updatedNote = sharedNoteService.applyOperation(sharedNote, operation);
            String updatedContent = updatedNote.getContent();
            
            logger.info("Updated note content after applying operation: '{}'", updatedContent);
            logger.info("Content length change: {} -> {} (diff: {})", 
                sharedNote.getContent().length(), updatedContent.length(), 
                updatedContent.length() - sharedNote.getContent().length());
            
            // Create operation DTO with clientId from the incoming operation
            NoteOperationDto operationDtoWithClientId = convertToDto(operation);
            operationDtoWithClientId.setClientId(operationDto.getClientId());
            
            // Send confirmation back to sender (local echo)
            Map<String, Object> senderBroadcast = new HashMap<>();
            senderBroadcast.put("type", "OPERATION");
            senderBroadcast.put("operation", operationDtoWithClientId);
            senderBroadcast.put("content", updatedContent);
            senderBroadcast.put("userId", user.getId());
            senderBroadcast.put("username", username);
            senderBroadcast.put("timestamp", LocalDateTime.now());
            senderBroadcast.put("revision", operation.getSequenceNumber());
            
            logger.info("Sending confirmation to sender: clientId={}, content='{}'", 
                operationDto.getClientId(), updatedContent);
            
            // Send confirmation to sender
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/shared-note/operations", senderBroadcast);
            
            // Broadcast operation to OTHER connected users (excluding sender)
            Map<String, Object> othersBroadcast = new HashMap<>();
            othersBroadcast.put("type", "OPERATION");
            othersBroadcast.put("operation", operationDtoWithClientId);
            othersBroadcast.put("content", updatedContent);
            othersBroadcast.put("userId", user.getId());
            othersBroadcast.put("username", username);
            othersBroadcast.put("timestamp", LocalDateTime.now());
            othersBroadcast.put("revision", operation.getSequenceNumber());
            
            logger.info("Broadcasting operation to other users: clientId={}, content='{}'", 
                operationDto.getClientId(), updatedContent);
            
            // Send to all other users via topic (sender will ignore based on clientId)
            messagingTemplate.convertAndSend("/topic/shared-note/operations", othersBroadcast);
            
            logger.info("Processed note operation from user {}: {} at position {}", 
                username, operationDto.getOperationType(), operationDto.getPosition());
            logger.info("=== BACKEND handleNoteOperation DEBUG END ===");
            
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
            operation.getSequenceNumber(),
            null // clientId will be set separately when needed
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