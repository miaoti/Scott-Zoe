package com.couplewebsite.repository;

import com.couplewebsite.entity.PrizeHistory;
import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PrizeHistoryRepository extends JpaRepository<PrizeHistory, Long> {
    
    /**
     * Find all prize history for a specific recipient with pagination
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient ORDER BY ph.claimedAt DESC")
    Page<PrizeHistory> findByRecipientOrderByClaimedAtDesc(@Param("recipient") User recipient, Pageable pageable);
    
    /**
     * Find all prize history for a specific recipient
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> findByRecipientOrderByClaimedAtDesc(@Param("recipient") User recipient);
    
    /**
     * Find prize history by box
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.box = :box")
    List<PrizeHistory> findByBox(@Param("box") SurpriseBox box);
    
    /**
     * Find prize history by completion type
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient AND ph.completionType = :completionType ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> findByRecipientAndCompletionTypeOrderByClaimedAtDesc(
        @Param("recipient") User recipient, 
        @Param("completionType") SurpriseBox.CompletionType completionType
    );
    
    /**
     * Find prize history within date range
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient AND ph.claimedAt BETWEEN :startDate AND :endDate ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> findByRecipientAndClaimedAtBetweenOrderByClaimedAtDesc(
        @Param("recipient") User recipient,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Count total prizes claimed by recipient
     */
    @Query("SELECT COUNT(ph) FROM PrizeHistory ph WHERE ph.recipient = :recipient")
    Long countByRecipient(@Param("recipient") User recipient);
    
    /**
     * Count prizes claimed by completion type
     */
    @Query("SELECT COUNT(ph) FROM PrizeHistory ph WHERE ph.recipient = :recipient AND ph.completionType = :completionType")
    Long countByRecipientAndCompletionType(
        @Param("recipient") User recipient,
        @Param("completionType") SurpriseBox.CompletionType completionType
    );
    
    /**
     * Search prize history by prize name
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient AND LOWER(ph.prizeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> searchByRecipientAndPrizeName(
        @Param("recipient") User recipient,
        @Param("searchTerm") String searchTerm
    );
    
    /**
     * Find recent prize history (last N days)
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient AND ph.claimedAt >= :sinceDate ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> findRecentByRecipient(
        @Param("recipient") User recipient,
        @Param("sinceDate") LocalDateTime sinceDate
    );
    
    /**
     * Count prizes claimed after a specific date
     */
    @Query("SELECT COUNT(ph) FROM PrizeHistory ph WHERE ph.recipient = :recipient AND ph.claimedAt >= :sinceDate")
    Long countByRecipientAndClaimedAtAfter(
        @Param("recipient") User recipient,
        @Param("sinceDate") LocalDateTime sinceDate
    );
    
    /**
     * Find prize history by recipient and prize name containing (case insensitive)
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.recipient = :recipient AND LOWER(ph.prizeName) LIKE LOWER(CONCAT('%', :prizeName, '%')) ORDER BY ph.claimedAt DESC")
    List<PrizeHistory> findByRecipientAndPrizeNameContainingIgnoreCase(
        @Param("recipient") User recipient,
        @Param("prizeName") String prizeName
    );
    
    /**
     * Find prize history by box ID
     */
    @Query("SELECT ph FROM PrizeHistory ph WHERE ph.box.id = :boxId")
    List<PrizeHistory> findByBoxId(@Param("boxId") Long boxId);
}