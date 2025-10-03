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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
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
        prizeHistory.setTaskDescription(box.getTaskDescription()); // Fix: Set the required taskDescription
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
        
        // Calculate this week's prizes
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        Long prizesThisWeek = prizeHistoryRepository.countByRecipientAndClaimedAtAfter(recipient, weekStart);
        
        // Create completion type breakdown
        Map<String, Long> completionTypeStats = new HashMap<>();
        completionTypeStats.put("TASK", prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.TASK));
        completionTypeStats.put("PAYMENT", prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.PAYMENT));
        completionTypeStats.put("LOCATION", prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.LOCATION));
        completionTypeStats.put("TIME", prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.TIME));
        completionTypeStats.put("PHOTO", prizeHistoryRepository.countByRecipientAndCompletionType(recipient, SurpriseBox.CompletionType.PHOTO));
        
        PrizeHistoryStats stats = new PrizeHistoryStats(totalPrizes, prizesThisWeek, completionTypeStats);
        
        // Calculate month and year stats
        LocalDateTime monthStart = LocalDateTime.now().minusMonths(1);
        LocalDateTime yearStart = LocalDateTime.now().minusYears(1);
        stats.setPrizesThisMonth(prizeHistoryRepository.countByRecipientAndClaimedAtAfter(recipient, monthStart));
        stats.setPrizesThisYear(prizeHistoryRepository.countByRecipientAndClaimedAtAfter(recipient, yearStart));
        
        return stats;
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
    public void deletePrizeHistory(Long id) {
        prizeHistoryRepository.deleteById(id);
    }
    
    public void deletePrizeHistory(Long id, Long userId) {
        // Additional validation can be added here to ensure user owns the prize history
        prizeHistoryRepository.deleteById(id);
    }
    
    public List<PrizeHistory> searchPrizeHistoryByName(User user, String prizeName) {
        return prizeHistoryRepository.findByRecipientAndPrizeNameContainingIgnoreCase(user, prizeName);
    }
    
    public List<PrizeHistory> getPrizeHistoryByBoxId(Long boxId) {
        return prizeHistoryRepository.findByBoxId(boxId);
    }
    
    /**
     * Inner class for prize history statistics
     */
    public static class PrizeHistoryStats {
        private long totalPrizes;
        private long prizesThisWeek;
        private long prizesThisMonth;
        private long prizesThisYear;
        private Map<String, Long> completionTypeStats;
        private Map<String, Long> completionTypeBreakdown;
        
        public PrizeHistoryStats(long totalPrizes, long prizesThisWeek, Map<String, Long> completionTypeStats) {
            this.totalPrizes = totalPrizes;
            this.prizesThisWeek = prizesThisWeek;
            this.completionTypeStats = completionTypeStats;
            this.completionTypeBreakdown = completionTypeStats;
            // Initialize month and year stats (can be calculated separately)
            this.prizesThisMonth = 0;
            this.prizesThisYear = 0;
        }
        
        // Getters
        public long getTotalPrizes() { return totalPrizes; }
        public long getPrizesThisWeek() { return prizesThisWeek; }
        public long getPrizesThisMonth() { return prizesThisMonth; }
        public long getPrizesThisYear() { return prizesThisYear; }
        public Map<String, Long> getCompletionTypeStats() { return completionTypeStats; }
        public Map<String, Long> getCompletionTypeBreakdown() { return completionTypeBreakdown; }
        
        // Setters for month and year stats
        public void setPrizesThisMonth(long prizesThisMonth) { this.prizesThisMonth = prizesThisMonth; }
        public void setPrizesThisYear(long prizesThisYear) { this.prizesThisYear = prizesThisYear; }
    }
}