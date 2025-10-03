package com.couplewebsite.service;

import com.couplewebsite.entity.PrizeHistory;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.SurpriseBoxRepository;
import com.couplewebsite.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Random;

@Service
@Transactional
public class SurpriseBoxService {

    private static final Logger logger = LoggerFactory.getLogger(SurpriseBoxService.class);

    @Autowired
    private SurpriseBoxRepository surpriseBoxRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PrizeHistoryService prizeHistoryService;
    
    @Autowired
    private UserService userService;

    /**
     * Create a new surprise box
     */
    public SurpriseBox createBox(Long ownerId, Long recipientId, String prizeName, 
                                String prizeDescription, SurpriseBox.CompletionType completionType, 
                                String expiresAt, BigDecimal priceAmount, 
                                String taskDescription) {
        return createBox(ownerId, recipientId, prizeName, prizeDescription, completionType, 
                        expiresAt, priceAmount, taskDescription, true);
    }
    
    /**
     * Create a new surprise box with drop scheduling options
     */
    public SurpriseBox createBox(Long ownerId, Long recipientId, String prizeName, 
                                String prizeDescription, SurpriseBox.CompletionType completionType, 
                                String expiresAt, BigDecimal priceAmount, 
                                String taskDescription, Boolean isInstantDrop) {
        
        // Check if owner already has an active box
        User owner = userService.findById(ownerId);
        if (hasActiveBox(owner)) {
            throw new RuntimeException("You already have an active surprise box. Only one box can be active at a time.");
        }
        
        User recipient = userService.findById(recipientId);
        
        SurpriseBox box = new SurpriseBox();
        box.setOwner(owner);
        box.setRecipient(recipient);
        box.setPrizeName(prizeName);
        box.setPrizeDescription(prizeDescription);
        box.setCompletionType(completionType);

        box.setPriceAmount(priceAmount);
        box.setTaskDescription(taskDescription);
        box.setStatus(SurpriseBox.BoxStatus.CREATED);
        box.setCreatedAt(LocalDateTime.now());
        
        // Set expiration duration (default 24 hours if not provided)
        if (expiresAt != null && !expiresAt.trim().isEmpty()) {
            try {
                // Parse expiration minutes from string
                int expirationMinutes = Integer.parseInt(expiresAt);
                box.setExpirationMinutes(expirationMinutes);
            } catch (Exception e) {
                // If parsing fails, set default 24 hours (1440 minutes)
                box.setExpirationMinutes(1440);
            }
        } else {
            // Default expiration: 24 hours (1440 minutes)
            box.setExpirationMinutes(1440);
        }
        
        // Set drop scheduling fields
        LocalDateTime now = LocalDateTime.now();
        box.setIsInstantDrop(isInstantDrop != null ? isInstantDrop : true);
        
        if (box.getIsInstantDrop()) {
            // Instant drop - set status to DROPPED right away
            box.setStatus(SurpriseBox.BoxStatus.DROPPED);
            box.setDroppedAt(now);
            box.setDropAt(now);
            box.setIsDropping(true); // Start in dropping phase
            
            // Set 20-second re-drop cycle
            box.setDropDurationMinutes(0); // Always visible when dropping
            box.setPauseDurationMinutes(0); // 20 seconds pause = 0.33 minutes
            box.setNextDropTime(now.plusSeconds(20)); // Next re-drop in 20 seconds
        } else {
            // Drop later - calculate random drop time between 1-7 days
            int randomDays = 1 + (int) (Math.random() * 7); // Random between 1-7 days
            int randomHours = (int) (Math.random() * 24); // Random hour within the day
            int randomMinutes = (int) (Math.random() * 60); // Random minute within the hour
            
            LocalDateTime scheduledDropTime = now.plusDays(randomDays)
                                                .plusHours(randomHours)
                                                .plusMinutes(randomMinutes);
            
            box.setScheduledDropTime(scheduledDropTime);
            box.setDropAt(scheduledDropTime);
            box.setIsDropping(false);
            
            // Set default drop and pause durations for when it eventually drops
            box.setDropDurationMinutes(3);
            box.setPauseDurationMinutes(5);
            box.setNextDropTime(scheduledDropTime.plusMinutes(3));
        }
        
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Drop a box (make it available to recipient)
     */
    public SurpriseBox dropBox(Long boxId) {
        SurpriseBox box = findById(boxId);
        
        if (box.getStatus() != SurpriseBox.BoxStatus.CREATED) {
            throw new RuntimeException("Box cannot be dropped. Current status: " + box.getStatus());
        }
        
        box.setStatus(SurpriseBox.BoxStatus.DROPPED);
        box.setDroppedAt(LocalDateTime.now());
        
        // Expiration will be calculated from openedAt when the box is opened
        // No need to set expiresAt here as it's calculated dynamically
        
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Open a box (recipient opens it)
     */
    public SurpriseBox openBox(Long boxId, String username) {
        SurpriseBox box = surpriseBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));

        if (!box.getRecipient().getUsername().equals(username)) {
            throw new RuntimeException("You are not the recipient of this box");
        }

        if (box.getStatus() != SurpriseBox.BoxStatus.DROPPED) {
            throw new RuntimeException("Box cannot be opened");
        }

        box.setStatus(SurpriseBox.BoxStatus.OPENED);
        box.setOpenedAt(LocalDateTime.now());
        return surpriseBoxRepository.save(box);
    }

    /**
     * Complete a box (recipient completes the task)
     */
    public SurpriseBox completeBox(Long boxId, String username, String completionData) {
        SurpriseBox box = surpriseBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));

        if (!box.getRecipient().getUsername().equals(username)) {
            throw new RuntimeException("You are not the recipient of this box");
        }

        // Check if box is expired
        if (box.isExpired()) {
            throw new RuntimeException("This box has expired and cannot be completed");
        }

        if (box.getStatus() != SurpriseBox.BoxStatus.OPENED) {
            throw new RuntimeException("Box must be opened before it can be completed");
        }

        box.setStatus(SurpriseBox.BoxStatus.WAITING_APPROVAL);
        box.setCompletionData(completionData);
        box.setCompletedAt(LocalDateTime.now());
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Approve box completion (owner approves)
     */
    public SurpriseBox approveCompletion(Long boxId, Long ownerId) {
        SurpriseBox box = findById(boxId);
        
        // Verify owner
        if (!box.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You are not authorized to approve this box.");
        }
        
        // Check if box is expired
        if (box.isExpired()) {
            throw new RuntimeException("This box has expired and cannot be approved");
        }
        
        if (box.getStatus() != SurpriseBox.BoxStatus.WAITING_APPROVAL) {
            throw new RuntimeException("Box is not waiting for approval. Current status: " + box.getStatus());
        }
        
        // Set status to APPROVED so recipient can claim the prize
        box.setStatus(SurpriseBox.BoxStatus.APPROVED);
        
        // Clear any previous rejection reason since the box is now approved
        box.setRejectionReason(null);
        
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Reject box completion (owner rejects)
     */
    public SurpriseBox rejectCompletion(Long boxId, Long ownerId, String rejectionReason) {
        SurpriseBox box = findById(boxId);
        
        // Verify owner
        if (!box.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You are not authorized to reject this box.");
        }
        
        if (box.getStatus() != SurpriseBox.BoxStatus.WAITING_APPROVAL) {
            throw new RuntimeException("Box is not waiting for approval. Current status: " + box.getStatus());
        }
        
        box.setStatus(SurpriseBox.BoxStatus.DROPPED);
        box.setRejectionReason(rejectionReason);
        
        // Extend expiration by 12 hours (720 minutes)
        int currentExpiration = box.getExpirationMinutes() != null ? box.getExpirationMinutes() : 1440;
        box.setExpirationMinutes(currentExpiration + 720);
        
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Cancel a box (owner cancels before drop or after rejection)
     */
    public void cancelBox(Long boxId, Long ownerId) {
        SurpriseBox box = findById(boxId);
        
        // Verify owner
        if (!box.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You are not authorized to cancel this box.");
        }
        
        if (box.getStatus() == SurpriseBox.BoxStatus.CLAIMED) {
            throw new RuntimeException("Cannot cancel a claimed box.");
        }
        
        surpriseBoxRepository.delete(box);
    }
    
    /**
     * Find box by ID
     */
    public SurpriseBox findById(Long id) {
        Optional<SurpriseBox> box = surpriseBoxRepository.findById(id);
        if (box.isPresent()) {
            return box.get();
        }
        throw new RuntimeException("Surprise box not found with id: " + id);
    }
    
    /**
     * Get boxes owned by user
     */
    public List<SurpriseBox> getBoxesByOwner(User owner) {
        return surpriseBoxRepository.findByOwnerOrderByCreatedAtDesc(owner);
    }
    
    /**
     * Get boxes received by user (only claimed boxes)
     */
    public List<SurpriseBox> getBoxesByRecipient(User recipient) {
        // Only return boxes that have been claimed by the recipient
        return surpriseBoxRepository.findByRecipientOrderByCreatedAtDesc(recipient)
                .stream()
                .filter(box -> box.getClaimedAt() != null)
                .collect(Collectors.toList());
    }
    
    /**
     * Get dropped boxes for recipient (boxes that are dropped but not yet claimed)
     */
    public List<SurpriseBox> getDroppedBoxesByRecipient(User recipient) {
        return surpriseBoxRepository.findByRecipientAndStatusOrderByCreatedAtDesc(recipient, SurpriseBox.BoxStatus.DROPPED);
    }
    
    /**
     * Get active box for owner
     */
    public Optional<SurpriseBox> getActiveBoxByOwner(Long userId) {
        User user = userService.findById(userId);
        // Return active boxes for owners (created boxes that are not yet claimed/expired)
        return surpriseBoxRepository.findActiveBoxByOwner(user);
    }
    
    /**
     * Get active box for user (both as owner and recipient)
     */
    public Optional<SurpriseBox> getActiveBox(Long userId) {
        User user = userService.findById(userId);
        
        // First check if user has an active box as owner
        Optional<SurpriseBox> ownerBox = surpriseBoxRepository.findActiveBoxByOwner(user);
        if (ownerBox.isPresent()) {
            return ownerBox;
        }
        
        // Then check if user has an active box as recipient (OPENED or WAITING_APPROVAL)
        Optional<SurpriseBox> recipientBox = surpriseBoxRepository.findActiveBoxByRecipient(user);
        return recipientBox;
    }
    
    /**
     * Check if user has active box
     */
    public boolean hasActiveBox(User user) {
        // Check for active boxes as owner (created boxes that are not yet claimed/expired)
        boolean hasActiveAsOwner = surpriseBoxRepository.hasActiveBoxAsOwner(user);
        
        // Also check for active boxes as recipient (OPENED, WAITING_APPROVAL, APPROVED, or activated DROPPED boxes)
        boolean hasActiveAsRecipient = surpriseBoxRepository.hasActiveBoxAsRecipient(user);
        
        return hasActiveAsOwner || hasActiveAsRecipient;
    }

    /**
     * Activate a box when recipient clicks on it from dashboard (makes it available for interaction)
     */
    public SurpriseBox activateBox(Long boxId, Long userId) {
        logger.debug("activateBox: Starting activation process for boxId {} by userId {}", boxId, userId);
        
        SurpriseBox box = surpriseBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));
        
        logger.debug("activateBox: Found box {} - Current status: {}, ClaimedAt: {}", 
            box.getId(), box.getStatus(), box.getClaimedAt());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify the user is the recipient
        if (!box.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("User is not the recipient of this box");
        }
        
        // Only allow activation if box is dropped and not already activated
        if (!box.getStatus().equals(SurpriseBox.BoxStatus.DROPPED)) {
            logger.warn("activateBox: Box {} is not in DROPPED status, current status: {}", boxId, box.getStatus());
            throw new RuntimeException("Box cannot be activated in current status: " + box.getStatus());
        }
        
        // Check if already activated (claimedAt is set)
        if (box.getClaimedAt() != null) {
            logger.debug("activateBox: Box {} is already activated at {}", boxId, box.getClaimedAt());
            return box; // Already activated, return as-is
        }
        
        // Mark as activated by setting claimedAt timestamp while keeping DROPPED status
        // This allows the box to be considered "active" for the recipient
        box.setClaimedAt(LocalDateTime.now());
        
        SurpriseBox savedBox = surpriseBoxRepository.save(box);
        logger.debug("activateBox: Successfully activated box {} - Status: {}, ClaimedAt: {}", 
            savedBox.getId(), savedBox.getStatus(), savedBox.getClaimedAt());
        
        return savedBox;
    }
    
    /**
     * Open a box (sets openedAt timestamp to start expiration countdown)
     */
    @Transactional
    public SurpriseBox openBox(Long boxId, User opener) {
        logger.debug("openBox: Attempting to open box {} by user {}", boxId, opener.getId());
        
        SurpriseBox box = findById(boxId);
        if (box == null) {
            logger.warn("openBox: Box {} not found", boxId);
            throw new RuntimeException("Box not found");
        }
        
        // Verify the opener is the recipient
        if (!box.getRecipient().getId().equals(opener.getId())) {
            logger.warn("openBox: User {} is not the recipient of box {}", opener.getId(), boxId);
            throw new RuntimeException("Only the recipient can open this box");
        }
        
        // Only allow opening if box is in DROPPED status
        if (!box.getStatus().equals(SurpriseBox.BoxStatus.DROPPED)) {
            logger.warn("openBox: Box {} is not in DROPPED status, current status: {}", boxId, box.getStatus());
            throw new RuntimeException("Box cannot be opened in current status: " + box.getStatus());
        }
        
        // Check if box is already expired
        if (box.isExpired()) {
            logger.warn("openBox: Box {} is already expired", boxId);
            throw new RuntimeException("This box has expired and cannot be opened");
        }
        
        // Set opened timestamp if not already set (start expiration countdown)
        if (box.getOpenedAt() == null) {
            box.setOpenedAt(LocalDateTime.now());
            logger.debug("openBox: Set openedAt timestamp for box {} to start expiration countdown", boxId);
        }
        
        SurpriseBox savedBox = surpriseBoxRepository.save(box);
        logger.debug("openBox: Successfully opened box {} - OpenedAt: {}", 
            savedBox.getId(), savedBox.getOpenedAt());
        
        return savedBox;
    }
    
    /**
     * Actually claim a box after the full workflow is completed (open -> complete -> approve)
     */
    @Transactional
    public SurpriseBox claimBox(Long boxId, User claimer) {
        logger.debug("claimBox: Attempting to claim box {} by user {}", boxId, claimer.getId());
        
        SurpriseBox box = findById(boxId);
        if (box == null) {
            logger.warn("claimBox: Box {} not found", boxId);
            throw new RuntimeException("Box not found");
        }
        
        // Verify the claimer is the recipient
        if (!box.getRecipient().getId().equals(claimer.getId())) {
            logger.warn("claimBox: User {} is not the recipient of box {}", claimer.getId(), boxId);
            throw new RuntimeException("Only the recipient can claim this box");
        }
        
        // Check if box is expired
        if (box.isExpired()) {
            logger.warn("claimBox: Box {} is expired and cannot be claimed", boxId);
            throw new RuntimeException("This box has expired and cannot be claimed");
        }
        
        // Only allow final claiming if box has been approved (status should be APPROVED)
        if (!box.getStatus().equals(SurpriseBox.BoxStatus.APPROVED)) {
            logger.warn("claimBox: Box {} is not in APPROVED status, current status: {}", boxId, box.getStatus());
            throw new RuntimeException("Box cannot be claimed in current status: " + box.getStatus() + ". Box must be approved first.");
        }
        
        // Set claimed timestamp and update status to CLAIMED
        box.setClaimedAt(LocalDateTime.now());
        box.setStatus(SurpriseBox.BoxStatus.CLAIMED);
        
        SurpriseBox savedBox = surpriseBoxRepository.save(box);
        logger.debug("claimBox: Successfully claimed box {} - New status: {}, ClaimedAt: {}", 
            savedBox.getId(), savedBox.getStatus(), savedBox.getClaimedAt());
        
        // Create prize history record after box is claimed
        prizeHistoryService.createPrizeHistory(savedBox);
        
        return savedBox;
    }
    
    /**
     * Get boxes waiting for approval by owner
     */
    public List<SurpriseBox> getBoxesWaitingForApproval(User owner) {
        return surpriseBoxRepository.findBoxesWaitingForApprovalByOwner(owner);
    }
    
    /**
     * Get boxes that are ready to drop for a user (as recipient)
     */
    public List<SurpriseBox> getDroppingBoxes(Long userId) {
        // Get boxes that are in DROPPED status and currently dropping (isDropping = true)
        LocalDateTime now = LocalDateTime.now();
        User recipient = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find DROPPED boxes that are currently in dropping phase and not fully claimed
        // Note: claimedAt may be set for activated boxes, but status should still be DROPPED
        List<SurpriseBox> droppingBoxes = surpriseBoxRepository.findByRecipientAndStatusAndDropAtBefore(
            recipient, 
            SurpriseBox.BoxStatus.DROPPED, 
            now
        ).stream()
        .filter(box -> box.getIsDropping() && box.getStatus().equals(SurpriseBox.BoxStatus.DROPPED))
        .collect(Collectors.toList());
        
        logger.debug("getDroppingBoxes: Found {} boxes ready to drop for user {}", droppingBoxes.size(), userId);
        for (SurpriseBox box : droppingBoxes) {
            logger.debug("getDroppingBoxes: Box {} - Status: {}, DropAt: {}, ClaimedAt: {}, IsDropping: {}", 
                box.getId(), box.getStatus(), box.getDropAt(), box.getClaimedAt(), box.getIsDropping());
        }
        
        return droppingBoxes;
    }
    
    /**
     * Get boxes ready for dropping (scheduled task)
     */
    public List<SurpriseBox> getBoxesReadyForDrop() {
        return surpriseBoxRepository.findBoxesReadyForDrop();
    }
    
    /**
     * Get expired boxes (scheduled task)
     */
    public List<SurpriseBox> getExpiredBoxes() {
        return surpriseBoxRepository.findExpiredBoxes(LocalDateTime.now());
    }
    
    /**
     * Mark boxes as expired (scheduled task)
     */
    public void markBoxesAsExpired() {
        List<SurpriseBox> expiredBoxes = getExpiredBoxes();
        for (SurpriseBox box : expiredBoxes) {
            box.setStatus(SurpriseBox.BoxStatus.EXPIRED);
            surpriseBoxRepository.save(box);
        }
    }
    
    /**
     * Get boxes by status
     */
    public List<SurpriseBox> getBoxesByStatus(SurpriseBox.BoxStatus status) {
        return surpriseBoxRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    /**
     * Update box
     */
    public SurpriseBox updateBox(SurpriseBox box) {
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Mark a box as expired
     */
    @Transactional
    public SurpriseBox markAsExpired(Long boxId) {
        SurpriseBox box = findById(boxId);
        if (box != null && !box.getStatus().equals(SurpriseBox.BoxStatus.CLAIMED) && !box.getStatus().equals(SurpriseBox.BoxStatus.EXPIRED)) {
            box.setStatus(SurpriseBox.BoxStatus.EXPIRED);
            return surpriseBoxRepository.save(box);
        }
        return box;
    }
    
    /**
     * Find boxes ready to drop (scheduled time has passed)
     */
    public List<SurpriseBox> findBoxesReadyToDrop() {
        LocalDateTime now = LocalDateTime.now();
        return surpriseBoxRepository.findByStatusAndDropAtBefore(SurpriseBox.BoxStatus.CREATED, now);
    }
    
    public List<SurpriseBox> findDroppedBoxesForIntermittentCycle() {
        // Only return DROPPED boxes that haven't been fully claimed yet (status is still DROPPED)
        return surpriseBoxRepository.findByStatusAndNextDropTimeIsNotNull()
                .stream()
                .filter(box -> box.getStatus().equals(SurpriseBox.BoxStatus.DROPPED))
                .collect(Collectors.toList());
    }
    
    /**
     * Find expired boxes that haven't been marked as expired yet
     */
    public List<SurpriseBox> findExpiredBoxes() {
        LocalDateTime now = LocalDateTime.now();
        return surpriseBoxRepository.findByStatusIn(
            List.of(SurpriseBox.BoxStatus.DROPPED, SurpriseBox.BoxStatus.WAITING_APPROVAL))
            .stream()
            .filter(box -> box.isExpired())
            .collect(Collectors.toList());
    }
    
    /**
     * Find boxes dropping soon (within specified minutes)
     */
    public List<SurpriseBox> findBoxesDroppingSoon(int minutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusMinutes(minutes);
        return surpriseBoxRepository.findByStatusAndDropAtBetween(SurpriseBox.BoxStatus.CREATED, now, future);
    }
    
    /**
     * Find old completed boxes for cleanup
     */
    public List<SurpriseBox> findOldCompletedBoxes(LocalDateTime cutoffDate) {
        return surpriseBoxRepository.findByStatusInAndUpdatedAtBefore(
            List.of(SurpriseBox.BoxStatus.CLAIMED, SurpriseBox.BoxStatus.EXPIRED), cutoffDate);
    }
    
    /**
     * Archive a box (soft delete or move to archive table)
     */
    @Transactional
    public void archiveBox(Long boxId) {
        // For now, we'll just mark it as archived in status
        // In a real implementation, you might move to an archive table
        SurpriseBox box = findById(boxId);
        if (box != null) {
            // Could add an ARCHIVED status or just delete
            surpriseBoxRepository.delete(box);
        }
    }
    
    /**
     * Find boxes waiting for approval since a certain time
     */
    public List<SurpriseBox> findBoxesWaitingApprovalSince(LocalDateTime since) {
        return surpriseBoxRepository.findByStatusAndUpdatedAtBefore(SurpriseBox.BoxStatus.WAITING_APPROVAL, since);
    }
    
    /**
     * Count active boxes (not completed, cancelled, or expired)
     */
    public long countActiveBoxes() {
        return surpriseBoxRepository.countByStatusIn(
            List.of(SurpriseBox.BoxStatus.CREATED, SurpriseBox.BoxStatus.DROPPED, SurpriseBox.BoxStatus.WAITING_APPROVAL));
    }
    
    /**
     * Count pending boxes (not yet dropped)
     */
    public long countPendingBoxes() {
        return surpriseBoxRepository.countByStatus(SurpriseBox.BoxStatus.CREATED);
    }
    
    /**
     * Count boxes waiting for approval
     */
    public long countBoxesWaitingApproval() {
        return surpriseBoxRepository.countByStatus(SurpriseBox.BoxStatus.WAITING_APPROVAL);
    }
    
    /**
     * Save a surprise box
     */
    @Transactional
    public SurpriseBox save(SurpriseBox box) {
        return surpriseBoxRepository.save(box);
    }
}