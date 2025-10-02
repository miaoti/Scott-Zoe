package com.couplewebsite.controller;

import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.service.SurpriseBoxService;
import com.couplewebsite.service.UserService;
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
import java.util.Map;

@Controller
public class SurpriseBoxWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(SurpriseBoxWebSocketController.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private SurpriseBoxService surpriseBoxService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Handle subscription to surprise box updates
     */
    @MessageMapping("/surprise-box/subscribe")
    public void subscribeToUpdates(@Payload Map<String, Object> payload, Principal principal) {
        try {
            if (principal == null) {
                logger.warn("Principal is null - user not authenticated for WebSocket subscription");
                return;
            }
            
            String username = principal.getName();
            logger.info("User {} subscribed to surprise box updates", username);
            
            // No automatic notification sent - subscription is silent
            // Real notifications will be sent when actual events occur
            
        } catch (Exception e) {
            logger.error("Error handling surprise box subscription", e);
        }
    }
    
    /**
     * Handle heartbeat/ping messages
     */
    @MessageMapping("/surprise-box/ping")
    @SendToUser("/queue/surprise-box/pong")
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
    
    // Public methods for sending notifications (called by services)
    
    /**
     * Send box dropped notification
     */
    public void sendBoxDroppedNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_DROPPED", box);
            notification.put("message", "A surprise box has been dropped for you!");
            
            // Send to recipient
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.info("Sent box dropped notification for box {} to user {}", box.getId(), box.getRecipient().getUsername());
            
        } catch (Exception e) {
            logger.error("Error sending box dropped notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send box opened notification
     */
    public void sendBoxOpenedNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_OPENED", box);
            notification.put("message", "Your surprise box has been opened and is waiting for approval!");
            
            // Send to owner
            String ownerDestination = "/user/" + box.getOwner().getUsername() + "/queue/surprise-box/updates";
            messagingTemplate.convertAndSend(ownerDestination, notification);
            
            logger.info("Sent box opened notification for box {} to user {}", box.getId(), box.getOwner().getUsername());
            
        } catch (Exception e) {
            logger.error("Error sending box opened notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send box approved notification
     */
    public void sendBoxApprovedNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_APPROVED", box);
            notification.put("message", "Congratulations! Your prize has been approved and claimed!");
            
            // Send to recipient
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.info("Sent box approved notification for box {} to user {}", box.getId(), box.getRecipient().getUsername());
            
        } catch (Exception e) {
            logger.error("Error sending box approved notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send box rejected notification
     */
    public void sendBoxRejectedNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_REJECTED", box);
            notification.put("message", "Your box completion was rejected. Try again with extended time!");
            notification.put("rejectionReason", box.getRejectionReason());
            
            // Send to recipient
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.info("Sent box rejected notification for box {} to user {}", box.getId(), box.getRecipient().getUsername());
            
        } catch (Exception e) {
            logger.error("Error sending box rejected notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send box expired notification
     */
    public void sendBoxExpiredNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_EXPIRED", box);
            notification.put("message", "A surprise box has expired.");
            
            // Send to both owner and recipient
            String ownerDestination = "/user/" + box.getOwner().getUsername() + "/queue/surprise-box/updates";
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            
            messagingTemplate.convertAndSend(ownerDestination, notification);
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.info("Sent box expired notification for box {} to both users", box.getId());
            
        } catch (Exception e) {
            logger.error("Error sending box expired notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send box cancelled notification
     */
    public void sendBoxCancelledNotification(SurpriseBox box) {
        try {
            Map<String, Object> notification = createBoxNotification("BOX_CANCELLED", box);
            notification.put("message", "A surprise box has been cancelled.");
            
            // Send to recipient if box was already dropped
            if (box.getDroppedAt() != null) {
                String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
                messagingTemplate.convertAndSend(recipientDestination, notification);
            }
            
            logger.info("Sent box cancelled notification for box {}", box.getId());
            
        } catch (Exception e) {
            logger.error("Error sending box cancelled notification for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send general status update
     */
    public void sendBoxStatusUpdate(SurpriseBox box, String message) {
        try {
            Map<String, Object> notification = createBoxNotification("STATUS_UPDATE", box);
            notification.put("message", message);
            
            // Send to both owner and recipient
            String ownerDestination = "/user/" + box.getOwner().getUsername() + "/queue/surprise-box/updates";
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            
            messagingTemplate.convertAndSend(ownerDestination, notification);
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.info("Sent status update for box {} to both users: {}", box.getId(), message);
            
        } catch (Exception e) {
            logger.error("Error sending status update for box {}", box.getId(), e);
        }
    }
    
    /**
     * Send countdown update for box drop
     */
    public void sendCountdownUpdate(SurpriseBox box, long minutesRemaining) {
        try {
            Map<String, Object> notification = createBoxNotification("COUNTDOWN_UPDATE", box);
            notification.put("message", "Box dropping soon!");
            notification.put("minutesRemaining", minutesRemaining);
            
            // Send to recipient
            String recipientDestination = "/user/" + box.getRecipient().getUsername() + "/queue/surprise-box/updates";
            messagingTemplate.convertAndSend(recipientDestination, notification);
            
            logger.debug("Sent countdown update for box {} - {} minutes remaining", box.getId(), minutesRemaining);
            
        } catch (Exception e) {
            logger.error("Error sending countdown update for box {}", box.getId(), e);
        }
    }
    
    // Helper method to create base notification structure
    private Map<String, Object> createBoxNotification(String type, SurpriseBox box) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", type);
        notification.put("timestamp", LocalDateTime.now().toString());
        
        // Box information
        Map<String, Object> boxInfo = new HashMap<>();
        boxInfo.put("id", box.getId());
        boxInfo.put("prizeName", box.getPrizeName());
        boxInfo.put("status", box.getStatus().name());
        boxInfo.put("completionType", box.getCompletionType().name());
        boxInfo.put("dropAt", box.getDropAt());
        boxInfo.put("expiresAt", box.getExpiresAt());
        boxInfo.put("isExpired", box.isExpired());
        
        if (box.getOwner() != null) {
            Map<String, Object> ownerInfo = new HashMap<>();
            ownerInfo.put("id", box.getOwner().getId());
            ownerInfo.put("name", box.getOwner().getName());
            ownerInfo.put("username", box.getOwner().getUsername());
            boxInfo.put("owner", ownerInfo);
        }
        
        if (box.getRecipient() != null) {
            Map<String, Object> recipientInfo = new HashMap<>();
            recipientInfo.put("id", box.getRecipient().getId());
            recipientInfo.put("name", box.getRecipient().getName());
            recipientInfo.put("username", box.getRecipient().getUsername());
            boxInfo.put("recipient", recipientInfo);
        }
        
        notification.put("box", boxInfo);
        
        return notification;
    }
}