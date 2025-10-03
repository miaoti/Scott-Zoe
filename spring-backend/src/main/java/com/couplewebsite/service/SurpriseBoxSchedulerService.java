package com.couplewebsite.service;

import com.couplewebsite.controller.SurpriseBoxWebSocketController;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.SurpriseBox.BoxStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class SurpriseBoxSchedulerService {
    
    private static final Logger logger = LoggerFactory.getLogger(SurpriseBoxSchedulerService.class);
    
    @Autowired
    private SurpriseBoxService surpriseBoxService;
    
    @Autowired
    private SurpriseBoxWebSocketController webSocketController;
    
    /**
     * Check for boxes that need to be dropped (initial drop only)
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void processBoxDrops() {
        try {
            LocalDateTime now = LocalDateTime.now();
            logger.debug("[DEBUG] processBoxDrops running at {}", now);
            
            List<SurpriseBox> boxesToDrop = surpriseBoxService.findBoxesReadyToDrop();
            logger.debug("[DEBUG] Found {} boxes ready to drop", boxesToDrop.size());
            
            if (!boxesToDrop.isEmpty()) {
                logger.info("Processing {} boxes ready to drop", boxesToDrop.size());
                
                for (SurpriseBox box : boxesToDrop) {
                    logger.debug("[DEBUG] Box {} - Status: {}, DropAt: {}, Now: {}", 
                            box.getId(), box.getStatus(), box.getDropAt(), now);
                }
                
                for (SurpriseBox box : boxesToDrop) {
                    try {
                        // Only drop boxes that haven't been dropped yet (initial drop)
                        if (box.getStatus() == BoxStatus.CREATED) {
                            // Update box status to DROPPED
                            box.setStatus(BoxStatus.DROPPED);
                            box.setDroppedAt(now);
                            SurpriseBox droppedBox = surpriseBoxService.save(box);
                            
                            // Send WebSocket notification separately (don't let this fail the transaction)
                            try {
                                webSocketController.sendBoxDroppedNotification(droppedBox);
                            } catch (Exception wsException) {
                                logger.warn("Failed to send WebSocket notification for dropped box {}: {}", 
                                        box.getId(), wsException.getMessage());
                                // Don't rethrow - WebSocket failure shouldn't affect the database transaction
                            }
                            
                            logger.info("Successfully dropped box {} for user {}", 
                                    box.getId(), box.getRecipient().getUsername());
                        }
                        
                    } catch (Exception e) {
                        logger.error("Error dropping box {}", box.getId(), e);
                    }
                }
            } else {
                logger.debug("[DEBUG] No boxes ready to drop at {}", now);
            }
            
        } catch (Exception e) {
            logger.error("Error in processBoxDrops scheduled task", e);
        }
    }
    
    /**
     * Handle intermittent dropping cycles for dropped boxes
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void processIntermittentDropping() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<SurpriseBox> droppedBoxes = surpriseBoxService.findDroppedBoxesForIntermittentCycle();
            
            if (!droppedBoxes.isEmpty()) {
                logger.debug("Processing {} boxes for intermittent dropping", droppedBoxes.size());
                
                for (SurpriseBox box : droppedBoxes) {
                    try {
                        // Check if it's time to transition between dropping and pausing
                        if (box.getNextDropTime() != null && now.isAfter(box.getNextDropTime())) {
                            if (box.getIsDropping()) {
                                // Currently dropping, switch to pause
                                box.setIsDropping(false);
                                box.setNextDropTime(now.plusMinutes(box.getPauseDurationMinutes()));
                                logger.debug("Box {} switched to pause phase for {} minutes", 
                                        box.getId(), box.getPauseDurationMinutes());
                            } else {
                                // Currently paused, switch to dropping
                                box.setIsDropping(true);
                                box.setNextDropTime(now.plusMinutes(box.getDropDurationMinutes()));
                                logger.debug("Box {} switched to dropping phase for {} minutes", 
                                        box.getId(), box.getDropDurationMinutes());
                                
                                // Send notification when switching back to dropping
                                try {
                                    webSocketController.sendBoxDroppedNotification(box);
                                } catch (Exception wsException) {
                                    logger.warn("Failed to send WebSocket notification for intermittent drop {}: {}", 
                                            box.getId(), wsException.getMessage());
                                }
                            }
                            
                            surpriseBoxService.save(box);
                        }
                        
                    } catch (Exception e) {
                        logger.error("Error processing intermittent dropping for box {}", box.getId(), e);
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in processIntermittentDropping scheduled task", e);
        }
    }
    
    /**
     * Check for expired boxes and mark them as expired
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void processExpiredBoxes() {
        try {
            List<SurpriseBox> expiredBoxes = surpriseBoxService.findExpiredBoxes();
            
            if (!expiredBoxes.isEmpty()) {
                logger.info("Processing {} expired boxes", expiredBoxes.size());
                
                for (SurpriseBox box : expiredBoxes) {
                    try {
                        // Mark as expired first
                        SurpriseBox expiredBox = surpriseBoxService.markAsExpired(box.getId());
                        
                        // Send WebSocket notification separately (don't let this fail the transaction)
                        try {
                            webSocketController.sendBoxExpiredNotification(expiredBox);
                        } catch (Exception wsException) {
                            logger.warn("Failed to send WebSocket notification for expired box {}: {}", 
                                    box.getId(), wsException.getMessage());
                            // Don't rethrow - WebSocket failure shouldn't affect the database transaction
                        }
                        
                        logger.info("Successfully marked box {} as expired", box.getId());
                        
                    } catch (Exception e) {
                        logger.error("Error marking box {} as expired", box.getId(), e);
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in processExpiredBoxes scheduled task", e);
        }
    }
    
    /**
     * Send countdown notifications for boxes dropping soon
     * Runs every 15 minutes
     */
    @Scheduled(fixedRate = 900000) // Every 15 minutes
    public void sendCountdownNotifications() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<SurpriseBox> upcomingBoxes = surpriseBoxService.findBoxesDroppingSoon(60); // Next 60 minutes
            
            for (SurpriseBox box : upcomingBoxes) {
                try {
                    long minutesUntilDrop = ChronoUnit.MINUTES.between(now, box.getDropAt());
                    
                    // Send countdown notifications at specific intervals
                    if (shouldSendCountdownNotification(minutesUntilDrop)) {
                        webSocketController.sendCountdownUpdate(box, minutesUntilDrop);
                        logger.debug("Sent countdown notification for box {} - {} minutes remaining", 
                                box.getId(), minutesUntilDrop);
                    }
                    
                } catch (Exception e) {
                    logger.error("Error sending countdown notification for box {}", box.getId(), e);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in sendCountdownNotifications scheduled task", e);
        }
    }
    
    /**
     * Clean up old completed/expired boxes
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2:00 AM
    public void cleanupOldBoxes() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30); // Keep boxes for 30 days
            
            List<SurpriseBox> oldBoxes = surpriseBoxService.findOldCompletedBoxes(cutoffDate);
            
            if (!oldBoxes.isEmpty()) {
                logger.info("Cleaning up {} old boxes", oldBoxes.size());
                
                for (SurpriseBox box : oldBoxes) {
                    try {
                        // Archive or delete old boxes (keeping prize history)
                        surpriseBoxService.archiveBox(box.getId());
                        logger.debug("Archived old box {}", box.getId());
                        
                    } catch (Exception e) {
                        logger.error("Error archiving box {}", box.getId(), e);
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in cleanupOldBoxes scheduled task", e);
        }
    }
    
    /**
     * Send reminder notifications for boxes waiting for approval
     * Runs every 2 hours
     */
    @Scheduled(fixedRate = 7200000) // Every 2 hours
    public void sendApprovalReminders() {
        try {
            LocalDateTime reminderThreshold = LocalDateTime.now().minusHours(4); // 4 hours old
            List<SurpriseBox> boxesWaitingApproval = surpriseBoxService.findBoxesWaitingApprovalSince(reminderThreshold);
            
            if (!boxesWaitingApproval.isEmpty()) {
                logger.info("Sending approval reminders for {} boxes", boxesWaitingApproval.size());
                
                for (SurpriseBox box : boxesWaitingApproval) {
                    try {
                        String message = String.format("Reminder: %s is waiting for your approval on their completed surprise box!", 
                                box.getRecipient().getName());
                        webSocketController.sendBoxStatusUpdate(box, message);
                        
                        logger.debug("Sent approval reminder for box {}", box.getId());
                        
                    } catch (Exception e) {
                        logger.error("Error sending approval reminder for box {}", box.getId(), e);
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error in sendApprovalReminders scheduled task", e);
        }
    }
    
    /**
     * Health check for scheduler service
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void healthCheck() {
        try {
            logger.debug("SurpriseBoxSchedulerService health check - running normally");
            
            // Basic statistics
            long activeBoxes = surpriseBoxService.countActiveBoxes();
            long pendingBoxes = surpriseBoxService.countPendingBoxes();
            long waitingApproval = surpriseBoxService.countBoxesWaitingApproval();
            
            logger.info("Scheduler health check - Active: {}, Pending: {}, Waiting Approval: {}", 
                    activeBoxes, pendingBoxes, waitingApproval);
            
        } catch (Exception e) {
            logger.error("Error in scheduler health check", e);
        }
    }
    
    // Helper methods
    
    /**
     * Determine if a countdown notification should be sent based on minutes remaining
     */
    private boolean shouldSendCountdownNotification(long minutesRemaining) {
        // Send notifications at: 60, 30, 15, 10, 5, 1 minutes
        return minutesRemaining == 60 || minutesRemaining == 30 || minutesRemaining == 15 || 
               minutesRemaining == 10 || minutesRemaining == 5 || minutesRemaining == 1;
    }
}