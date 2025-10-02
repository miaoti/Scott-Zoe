package com.couplewebsite.service;

import com.couplewebsite.entity.PrizeHistory;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.SurpriseBoxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class SurpriseBoxService {

    @Autowired
    private SurpriseBoxRepository surpriseBoxRepository;
    
    @Autowired
    private PrizeHistoryService prizeHistoryService;
    
    @Autowired
    private UserService userService;

    /**
     * Create a new surprise box
     */
    public SurpriseBox createBox(Long ownerId, Long recipientId, String prizeName, 
                                String prizeDescription, SurpriseBox.CompletionType completionType, 
                                String completionCriteria, String expiresAt, BigDecimal priceAmount, 
                                String taskDescription) {
        
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
        box.setCompletionCriteria(completionCriteria);
        box.setPriceAmount(priceAmount);
        box.setTaskDescription(taskDescription);
        box.setStatus(SurpriseBox.BoxStatus.CREATED);
        box.setCreatedAt(LocalDateTime.now());
        
        // Parse and set expiration date if provided
        if (expiresAt != null && !expiresAt.trim().isEmpty()) {
            try {
                LocalDateTime expirationDateTime = LocalDateTime.parse(expiresAt);
                box.setExpiresAt(expirationDateTime);
            } catch (Exception e) {
                // If parsing fails, set a default expiration (24 hours from now)
                box.setExpiresAt(LocalDateTime.now().plusHours(24));
            }
        } else {
            // Default expiration if not provided (24 hours from now)
            box.setExpiresAt(LocalDateTime.now().plusHours(24));
        }
        
        // Set future drop time and initialize intermittent dropping
        LocalDateTime now = LocalDateTime.now();
        // Set dropAt to a future time (e.g., 1 minute from now) instead of immediate
        LocalDateTime futureDropTime = now.plusMinutes(1);
        box.setDropAt(futureDropTime);
        box.setIsDropping(false); // Start in waiting phase, not dropping
        box.setNextDropTime(futureDropTime.plusMinutes(box.getDropDurationMinutes())); // Next transition time
        
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
        
        // Set expiration time (24 hours from drop)
        box.setExpiresAt(LocalDateTime.now().plusHours(24));
        
        return surpriseBoxRepository.save(box);
    }
    
    /**
     * Open a box (recipient opens it)
     */
    public SurpriseBox openBox(Long boxId, Long recipientId) {
        SurpriseBox box = findById(boxId);
        
        // Verify recipient
        if (!box.getRecipient().getId().equals(recipientId)) {
            throw new RuntimeException("You are not authorized to open this box.");
        }
        
        if (box.getStatus() != SurpriseBox.BoxStatus.DROPPED) {
            throw new RuntimeException("Box cannot be opened. Current status: " + box.getStatus());
        }
        
        if (box.isExpired()) {
            throw new RuntimeException("This box has expired and cannot be opened.");
        }
        
        box.setStatus(SurpriseBox.BoxStatus.WAITING_APPROVAL);
        box.setOpenedAt(LocalDateTime.now());
        
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
        
        if (box.getStatus() != SurpriseBox.BoxStatus.WAITING_APPROVAL) {
            throw new RuntimeException("Box is not waiting for approval. Current status: " + box.getStatus());
        }
        
        box.setStatus(SurpriseBox.BoxStatus.CLAIMED);
        box.setClaimedAt(LocalDateTime.now());
        
        // Save the box first to ensure it has an ID
        SurpriseBox savedBox = surpriseBoxRepository.save(box);
        
        // Create prize history record after box is saved
        prizeHistoryService.createPrizeHistory(savedBox);
        
        return savedBox;
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
        
        // Extend expiration by 12 hours
        box.setExpiresAt(LocalDateTime.now().plusHours(12));
        
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
     * Get boxes received by user
     */
    public List<SurpriseBox> getBoxesByRecipient(User recipient) {
        return surpriseBoxRepository.findByRecipientOrderByCreatedAtDesc(recipient);
    }
    
    /**
     * Get active box for owner
     */
    public Optional<SurpriseBox> getActiveBoxByOwner(User owner) {
        return surpriseBoxRepository.findActiveBoxByOwner(owner);
    }
    
    /**
     * Check if user has an active box as owner
     */
    public boolean hasActiveBox(User owner) {
        return surpriseBoxRepository.hasActiveBoxAsOwner(owner);
    }
    
    /**
     * Get boxes waiting for approval by owner
     */
    public List<SurpriseBox> getBoxesWaitingForApproval(User owner) {
        return surpriseBoxRepository.findBoxesWaitingForApprovalByOwner(owner);
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
        return surpriseBoxRepository.findByStatusAndNextDropTimeIsNotNull();
    }
    
    /**
     * Find expired boxes that haven't been marked as expired yet
     */
    public List<SurpriseBox> findExpiredBoxes() {
        LocalDateTime now = LocalDateTime.now();
        return surpriseBoxRepository.findByStatusInAndExpiresAtBefore(
            List.of(SurpriseBox.BoxStatus.DROPPED, SurpriseBox.BoxStatus.WAITING_APPROVAL), now);
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