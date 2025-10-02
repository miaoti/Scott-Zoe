package com.couplewebsite.service;

import com.couplewebsite.entity.PrizeHistory;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.PrizeHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PrizeHistoryService {

    @Autowired
    private PrizeHistoryRepository prizeHistoryRepository;
    
    @Autowired
    private UserService userService;

    /**
     * Create prize history from a claimed surprise box
     */
    public PrizeHistory createPrizeHistory(SurpriseBox box) {
        if (box.getStatus() != SurpriseBox.BoxStatus.CLAIMED) {
            throw new RuntimeException("Cannot create prize history for unclaimed box");
        }
        
        PrizeHistory prizeHistory = new PrizeHistory();
        prizeHistory.setBox(box);
        prizeHistory.setRecipient(box.getRecipient());
        prizeHistory.setPrizeName(box.getPrizeName());
        prizeHistory.setPrizeDescription(box.getPrizeDescription());
        prizeHistory.setCompletionType(box.getCompletionType());
        prizeHistory.setClaimedAt(box.getClaimedAt() != null ? box.getClaimedAt() : LocalDateTime.now());
        
        return prizeHistoryRepository.save(prizeHistory);
    }
    
    /**
     * Get prize history by recipient with pagination
     */
    public Page<PrizeHistory> getPrizeHistoryByRecipient(Long recipientId, Pageable pageable) {
        User recipient = userService.findById(recipientId);
        return prizeHistoryRepository.findByRecipientOrderByClaimedAtDesc(recipient, pageable);
    }
    
    /**
     * Get all prize history by recipient
     */
    public List<PrizeHistory> getAllPrizeHistoryByRecipient(Long recipientId) {
        User recipient = userService.findById(recipientId);
        return prizeHistoryRepository.findByRecipientOrderByClaimedAtDesc(recipient);
    }
    
    /**
     * Get prize history by completion type
     */
    public List<PrizeHistory> getPrizeHistoryByCompletionType(Long recipientId, SurpriseBox.CompletionType completionType) {
        User recipient = userService.findById(recipientId);
        return prizeHistoryRepository.findByRecipientAndCompletionTypeOrderByClaimedAtDesc(recipient, completionType);
    }
    
    /**
     * Get prize history within date range
     */
    public List<PrizeHistory> getPrizeHistoryByDateRange(Long recipientId, LocalDateTime startDate, LocalDateTime endDate) {
        User recipient = userService.findById(recipientId);
        return prizeHistoryRepository.findByRecipientAndClaimedAtBetweenOrderByClaimedAtDesc(recipient, startDate, endDate);
    }
    
    /**
     * Search prize history by prize name
     */
    public List<PrizeHistory> searchPrizeHistory(Long recipientId, String searchTerm) {
        User recipient = userService.findById(recipientId);
        return prizeHistoryRepository.searchByRecipientAndPrizeName(recipient, searchTerm);
    }
    
    /**
     * Get recent prize history (last N days)
     */
    public List<PrizeHistory> getRecentPrizeHistory(Long recipientId, int days) {
        User recipient = userService.findById(recipientId);
        LocalDateTime sinceDate = LocalDateTime.now().minusDays(days);
        return prizeHistoryRepository.findRecentByRecipient(recipient, sinceDate);
    }
    
    /**
     * Get prize history statistics
     */
    public PrizeHistoryStats getPrizeHistoryStats(Long recipientId) {
        User recipient = userService.findById(recipientId);
        
        Long totalPrizes = prizeHistoryRepository.countByRecipient(recipient);
        Long taskPrizes = prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.TASK);
        Long locationPrizes = prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.LOCATION);
        Long timePrizes = prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.TIME);
        Long photoPrizes = prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.PHOTO);
        
        return new PrizeHistoryStats(totalPrizes, taskPrizes, locationPrizes, timePrizes, photoPrizes);
    }
    
    /**
     * Find prize history by ID
     */
    public PrizeHistory findById(Long id) {
        Optional<PrizeHistory> prizeHistory = prizeHistoryRepository.findById(id);
        if (prizeHistory.isPresent()) {
            return prizeHistory.get();
        }
        throw new RuntimeException("Prize history not found with id: " + id);
    }
    
    /**
     * Get prize history by box
     */
    public List<PrizeHistory> getPrizeHistoryByBox(SurpriseBox box) {
        return prizeHistoryRepository.findByBox(box);
    }
    
    /**
     * Delete prize history
     */
    public void deletePrizeHistory(Long id, Long recipientId) {
        PrizeHistory prizeHistory = findById(id);
        
        // Verify recipient owns this prize history
        if (!prizeHistory.getRecipient().getId().equals(recipientId)) {
            throw new RuntimeException("You are not authorized to delete this prize history.");
        }
        
        prizeHistoryRepository.delete(prizeHistory);
    }
    
    /**
     * Inner class for prize history statistics
     */
    public static class PrizeHistoryStats {
        private final Long totalPrizes;
        private final Long taskPrizes;
        private final Long locationPrizes;
        private final Long timePrizes;
        private final Long photoPrizes;
        
        public PrizeHistoryStats(Long totalPrizes, Long taskPrizes, Long locationPrizes, Long timePrizes, Long photoPrizes) {
            this.totalPrizes = totalPrizes;
            this.taskPrizes = taskPrizes;
            this.locationPrizes = locationPrizes;
            this.timePrizes = timePrizes;
            this.photoPrizes = photoPrizes;
        }
        
        // Getters
        public Long getTotalPrizes() { return totalPrizes; }
        public Long getTaskPrizes() { return taskPrizes; }
        public Long getLocationPrizes() { return locationPrizes; }
        public Long getTimePrizes() { return timePrizes; }
        public Long getPhotoPrizes() { return photoPrizes; }
    }
}