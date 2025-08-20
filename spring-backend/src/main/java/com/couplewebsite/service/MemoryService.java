package com.couplewebsite.service;

import com.couplewebsite.entity.Memory;
import com.couplewebsite.entity.Photo;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.MemoryRepository;
import com.couplewebsite.repository.PhotoRepository;
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
import java.util.stream.Collectors;

@Service
@Transactional
public class MemoryService {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoryService.class);
    
    @Autowired
    private MemoryRepository memoryRepository;
    
    @Autowired
    private PhotoRepository photoRepository;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Create a new memory
     */
    public Memory createMemory(String title, String description, LocalDate date, Memory.MemoryType type) {
        return createMemory(title, description, date, null, type);
    }
    
    /**
     * Create a new memory with optional end date for EVENT types
     */
    public Memory createMemory(String title, String description, LocalDate date, LocalDate endDate, Memory.MemoryType type) {
        try {
            // Get current user
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User creator = userDetailsService.getUserByUsername(username);
            
            // Create memory
            Memory memory = new Memory(title, description, date, type, creator);
            
            // Set end date for EVENT types
            if (type == Memory.MemoryType.EVENT && endDate != null) {
                if (endDate.isBefore(date)) {
                    throw new RuntimeException("End date cannot be before start date");
                }
                memory.setEndDate(endDate);
            } else if (type != Memory.MemoryType.EVENT && endDate != null) {
                throw new RuntimeException("End date can only be set for EVENT type memories");
            }
            
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
        return updateMemory(id, title, description, date, null, type);
    }
    
    /**
     * Update memory with optional end date for EVENT types
     */
    public Memory updateMemory(Long id, String title, String description, LocalDate date, LocalDate endDate, Memory.MemoryType type) {
        Memory memory = memoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Memory not found"));
        
        memory.setTitle(title);
        memory.setDescription(description);
        memory.setDate(date);
        memory.setType(type);
        
        // Handle end date for EVENT types
        if (type == Memory.MemoryType.EVENT && endDate != null) {
            if (endDate.isBefore(date)) {
                throw new RuntimeException("End date cannot be before start date");
            }
            memory.setEndDate(endDate);
        } else if (type != Memory.MemoryType.EVENT) {
            // Clear end date for non-EVENT types
            memory.setEndDate(null);
        } else {
            // EVENT type with null endDate - keep existing endDate or set to null
            memory.setEndDate(endDate);
        }
        
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
    
    /**
     * Get memories by specific date (including annual repetitions)
     */
    public List<Memory> getMemoriesByDate(LocalDate date) {
        try {
            // Get all memories
            List<Memory> allMemories = memoryRepository.findAll();
            
            // Filter memories that match the month and day, regardless of year
            return allMemories.stream()
                .filter(memory -> {
                    LocalDate memoryDate = memory.getDate();
                    return memoryDate.getMonthValue() == date.getMonthValue() &&
                           memoryDate.getDayOfMonth() == date.getDayOfMonth();
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching memories for date: {}", date, e);
            throw new RuntimeException("Failed to fetch memories for date: " + e.getMessage());
        }
    }
    
    /**
     * Get memories for a specific month (including annual repetitions)
     */
    public List<Memory> getMemoriesForMonth(int year, int month) {
        try {
            // Get all memories
            List<Memory> allMemories = memoryRepository.findAll();
            
            // Filter memories that match the month and day, regardless of year
            return allMemories.stream()
                .filter(memory -> {
                    LocalDate memoryDate = memory.getDate();
                    return memoryDate.getMonthValue() == month;
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching memories for month: {}/{}", year, month, e);
            throw new RuntimeException("Failed to fetch memories for month: " + e.getMessage());
        }
    }
    
    /**
     * Get memories filtered by type and time period
     */
    public List<Memory> getMemoriesFiltered(String type, String timeFilter) {
        try {
            List<Memory> memories = memoryRepository.findAllByOrderByDateDesc();
            
            // Filter by type if specified
            if (type != null && !"all".equals(type)) {
                Memory.MemoryType memoryType = Memory.MemoryType.fromValue(type);
                memories = memories.stream()
                    .filter(memory -> memory.getType() == memoryType)
                    .collect(Collectors.toList());
            }
            
            // Filter by time period if specified
            if (timeFilter != null && !"all".equals(timeFilter)) {
                LocalDate now = LocalDate.now();
                memories = memories.stream()
                    .filter(memory -> {
                        LocalDate memoryDate = memory.getDate();
                        
                        switch (timeFilter) {
                            case "thisYear":
                                return memoryDate.getYear() == now.getYear();
                            case "lastYear":
                                return memoryDate.getYear() == now.getYear() - 1;
                            case "thisMonth":
                                return memoryDate.getYear() == now.getYear() && 
                                       memoryDate.getMonth() == now.getMonth();
                            case "last6Months":
                                LocalDate sixMonthsAgo = now.minusMonths(6);
                                return memoryDate.isAfter(sixMonthsAgo) || memoryDate.isEqual(sixMonthsAgo);
                            case "older":
                                LocalDate twoYearsAgo = now.minusYears(2);
                                return memoryDate.isBefore(twoYearsAgo);
                            default:
                                return true;
                        }
                    })
                    .collect(Collectors.toList());
            }
            
            return memories;
        } catch (Exception e) {
            logger.error("Error fetching filtered memories with type: {} and timeFilter: {}", type, timeFilter, e);
            throw new RuntimeException("Failed to fetch filtered memories: " + e.getMessage());
        }
    }
    
    /**
     * Add photos to an EVENT memory
     */
    public Memory addPhotosToMemory(Long memoryId, List<Long> photoIds) {
        Memory memory = memoryRepository.findById(memoryId)
            .orElseThrow(() -> new RuntimeException("Memory not found"));
        
        // Only allow photo associations for EVENT type memories
        if (memory.getType() != Memory.MemoryType.EVENT) {
            throw new RuntimeException("Photos can only be associated with EVENT type memories");
        }
        
        // Fetch photos and add them to the memory
        List<Photo> photos = photoRepository.findAllById(photoIds);
        if (photos.size() != photoIds.size()) {
            throw new RuntimeException("Some photos were not found");
        }
        
        for (Photo photo : photos) {
            memory.addPhoto(photo);
        }
        
        return memoryRepository.save(memory);
    }
    
    /**
     * Remove photos from an EVENT memory
     */
    public Memory removePhotosFromMemory(Long memoryId, List<Long> photoIds) {
        Memory memory = memoryRepository.findById(memoryId)
            .orElseThrow(() -> new RuntimeException("Memory not found"));
        
        // Only allow photo associations for EVENT type memories
        if (memory.getType() != Memory.MemoryType.EVENT) {
            throw new RuntimeException("Photos can only be associated with EVENT type memories");
        }
        
        // Fetch photos and remove them from the memory
        List<Photo> photos = photoRepository.findAllById(photoIds);
        for (Photo photo : photos) {
            memory.removePhoto(photo);
        }
        
        return memoryRepository.save(memory);
    }
    
    // Helper class for anniversary information
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
