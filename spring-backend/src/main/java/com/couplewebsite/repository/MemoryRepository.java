package com.couplewebsite.repository;

import com.couplewebsite.entity.Memory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemoryRepository extends JpaRepository<Memory, Long> {
    
    /**
     * Find all memories ordered by date descending
     */
    List<Memory> findAllByOrderByDateDesc();
    
    /**
     * Find memory by ID with creator details
     */
    @Query("SELECT m FROM Memory m LEFT JOIN FETCH m.creator WHERE m.id = :id")
    Optional<Memory> findByIdWithCreator(@Param("id") Long id);
    
    /**
     * Find memories by type
     */
    List<Memory> findByTypeOrderByDateDesc(Memory.MemoryType type);
    
    /**
     * Find upcoming anniversaries within date range
     */
    @Query("SELECT m FROM Memory m LEFT JOIN FETCH m.creator " +
           "WHERE m.type = 'ANNIVERSARY' AND m.date BETWEEN :startDate AND :endDate " +
           "ORDER BY m.date ASC")
    List<Memory> findUpcomingAnniversaries(@Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
    
    /**
     * Find memories by creator
     */
    List<Memory> findByCreatorIdOrderByDateDesc(Long creatorId);
    
    /**
     * Count memories by creator
     */
    long countByCreatorId(Long creatorId);
}
