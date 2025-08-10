package com.couplewebsite.service;

import com.couplewebsite.entity.Memory;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.MemoryRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MemoryService {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoryService.class);
    
    @Autowired
    private MemoryRepository memoryRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Create a new memory
     */
    public Memory createMemory(String title, String description, LocalDate date, Memory.MemoryType type) {
        try {
            // Get current user
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User creator = userDetailsService.getUserByUsername(username);
            
            // Create memory
            Memory memory = new Memory(title, description, date, type, creator);
            Memory savedMemory = memoryRepository.save(memory);
            
            logger.info("Memory created successfully: {}", title);
            return savedMemory;
            
        } catch (Exception e) {
            logger.error("Error creating memory", e);
            throw new RuntimeException("Failed to create memory: " + e.getMessage());
        }
    }
    
    /**
     * Get all memories
     */
    public List<Memory> getAllMemories() {
        return memoryRepository.findAllByOrderByDateDesc();
    }
    
    /**
     * Get memory by ID
     */
    public Optional<Memory> getMemoryById(Long id) {
        return memoryRepository.findByIdWithCreator(id);
    }
    
    /**
     * Update memory
     */
    public Memory updateMemory(Long id, String title, String description, LocalDate date, Memory.MemoryType type) {
        Memory memory = memoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Memory not found"));
        
        memory.setTitle(title);
        memory.setDescription(description);
        memory.setDate(date);
        memory.setType(type);
        
        return memoryRepository.save(memory);
    }
    
    /**
     * Delete memory
     */
    public boolean deleteMemory(Long id) {
        try {
            if (memoryRepository.existsById(id)) {
                memoryRepository.deleteById(id);
                logger.info("Memory deleted successfully: {}", id);
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error deleting memory with ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * Get upcoming anniversaries
     */
    public List<Memory> getUpcomingAnniversaries(int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        return memoryRepository.findUpcomingAnniversaries(today, endDate);
    }
    
    /**
     * Calculate anniversary information
     */
    public AnniversaryInfo calculateAnniversary(LocalDate relationshipStartDate) {
        LocalDate today = LocalDate.now();
        
        // Calculate total days together
        long totalDays = ChronoUnit.DAYS.between(relationshipStartDate, today);
        
        // Calculate years, months, and days
        long years = ChronoUnit.YEARS.between(relationshipStartDate, today);
        LocalDate afterYears = relationshipStartDate.plusYears(years);
        long months = ChronoUnit.MONTHS.between(afterYears, today);
        LocalDate afterMonths = afterYears.plusMonths(months);
        long days = ChronoUnit.DAYS.between(afterMonths, today);
        
        // Calculate next anniversary
        LocalDate nextAnniversary = relationshipStartDate.plusYears(years + 1);
        long daysUntilNextAnniversary = ChronoUnit.DAYS.between(today, nextAnniversary);
        
        return new AnniversaryInfo(
                totalDays,
                years,
                months,
                days,
                nextAnniversary,
                daysUntilNextAnniversary
        );
    }
    
    /**
     * Get memories by type
     */
    public List<Memory> getMemoriesByType(Memory.MemoryType type) {
        return memoryRepository.findByTypeOrderByDateDesc(type);
    }
    
    // Inner class for anniversary information
    public static class AnniversaryInfo {
        private final long totalDays;
        private final long years;
        private final long months;
        private final long days;
        private final LocalDate nextAnniversary;
        private final long daysUntilNextAnniversary;
        
        public AnniversaryInfo(long totalDays, long years, long months, long days, 
                             LocalDate nextAnniversary, long daysUntilNextAnniversary) {
            this.totalDays = totalDays;
            this.years = years;
            this.months = months;
            this.days = days;
            this.nextAnniversary = nextAnniversary;
            this.daysUntilNextAnniversary = daysUntilNextAnniversary;
        }
        
        // Getters
        public long getTotalDays() { return totalDays; }
        public long getYears() { return years; }
        public long getMonths() { return months; }
        public long getDays() { return days; }
        public LocalDate getNextAnniversary() { return nextAnniversary; }
        public long getDaysUntilNextAnniversary() { return daysUntilNextAnniversary; }
    }
}
