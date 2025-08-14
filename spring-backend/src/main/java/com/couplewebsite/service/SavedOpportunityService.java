package com.couplewebsite.service;

import com.couplewebsite.entity.SavedOpportunity;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.SavedOpportunityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SavedOpportunityService {
    
    private static final Logger logger = LoggerFactory.getLogger(SavedOpportunityService.class);
    
    @Autowired
    private SavedOpportunityRepository savedOpportunityRepository;
    
    /**
     * Create a new saved opportunity for a user
     */
    public SavedOpportunity createSavedOpportunity(User user, String source) {
        SavedOpportunity opportunity = new SavedOpportunity(user, source);
        SavedOpportunity saved = savedOpportunityRepository.save(opportunity);
        
        logger.info("Created saved opportunity for user {} from source: {}", 
                user.getUsername(), source);
        
        return saved;
    }
    
    /**
     * Get count of unused opportunities for a user
     */
    public Long getUnusedOpportunityCount(User user) {
        return savedOpportunityRepository.countUnusedOpportunitiesByUser(user);
    }
    
    /**
     * Get all unused opportunities for a user
     */
    public List<SavedOpportunity> getUnusedOpportunities(User user) {
        return savedOpportunityRepository.findByUserAndIsUsedFalseOrderByCreatedAtAsc(user);
    }
    
    /**
     * Use the oldest saved opportunity for a user
     */
    public Optional<SavedOpportunity> useOldestOpportunity(User user) {
        Optional<SavedOpportunity> oldestOpportunity = 
                savedOpportunityRepository.findFirstByUserAndIsUsedFalseOrderByCreatedAtAsc(user);
        
        if (oldestOpportunity.isPresent()) {
            SavedOpportunity opportunity = oldestOpportunity.get();
            opportunity.markAsUsed();
            savedOpportunityRepository.save(opportunity);
            
            logger.info("Used saved opportunity {} for user {}", 
                    opportunity.getId(), user.getUsername());
            
            return Optional.of(opportunity);
        }
        
        return Optional.empty();
    }
    
    /**
     * Get all opportunities (used and unused) for a user
     */
    public List<SavedOpportunity> getAllOpportunities(User user) {
        return savedOpportunityRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    /**
     * Get opportunity statistics for a user
     */
    public OpportunityStats getOpportunityStats(User user) {
        Long total = savedOpportunityRepository.countByUser(user);
        Long unused = savedOpportunityRepository.countUnusedOpportunitiesByUser(user);
        Long used = savedOpportunityRepository.countUsedOpportunitiesByUser(user);
        
        return new OpportunityStats(total, unused, used);
    }
    
    /**
     * Check if user has any unused opportunities
     */
    public boolean hasUnusedOpportunities(User user) {
        return getUnusedOpportunityCount(user) > 0;
    }
    
    /**
     * Clear all unused opportunities for a user (for developer settings)
     */
    public void clearUnusedOpportunities(User user) {
        List<SavedOpportunity> unusedOpportunities = getUnusedOpportunities(user);
        savedOpportunityRepository.deleteAll(unusedOpportunities);
        
        logger.info("Cleared {} unused opportunities for user {}", 
                unusedOpportunities.size(), user.getUsername());
    }
    
    /**
     * DTO class for opportunity statistics
     */
    public static class OpportunityStats {
        private final Long total;
        private final Long unused;
        private final Long used;
        
        public OpportunityStats(Long total, Long unused, Long used) {
            this.total = total;
            this.unused = unused;
            this.used = used;
        }
        
        public Long getTotal() {
            return total;
        }
        
        public Long getUnused() {
            return unused;
        }
        
        public Long getUsed() {
            return used;
        }
    }
}