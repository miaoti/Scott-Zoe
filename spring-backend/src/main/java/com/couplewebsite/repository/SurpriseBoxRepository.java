package com.couplewebsite.repository;

import com.couplewebsite.entity.SurpriseBox;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurpriseBoxRepository extends JpaRepository<SurpriseBox, Long> {
    
    /**
     * Find all boxes owned by a specific user
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.owner = :owner ORDER BY sb.createdAt DESC")
    List<SurpriseBox> findByOwnerOrderByCreatedAtDesc(@Param("owner") User owner);
    
    /**
     * Find all boxes received by a specific user
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.recipient = :recipient ORDER BY sb.createdAt DESC")
    List<SurpriseBox> findByRecipientOrderByCreatedAtDesc(@Param("recipient") User recipient);
    
    /**
     * Find active box owned by user (only one active box per user)
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.owner = :owner AND sb.status NOT IN ('CLAIMED', 'EXPIRED')")
    Optional<SurpriseBox> findActiveBoxByOwner(@Param("owner") User owner);
    
    /**
     * Find boxes ready for dropping (CREATED status)
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.status = 'CREATED'")
    List<SurpriseBox> findBoxesReadyForDrop();
    
    /**
     * Find boxes that have expired
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.expiresAt IS NOT NULL AND sb.expiresAt < :currentTime AND sb.status NOT IN ('EXPIRED', 'CLAIMED')")
    List<SurpriseBox> findExpiredBoxes(@Param("currentTime") LocalDateTime currentTime);
    
    /**
     * Find boxes waiting for approval by owner
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.owner = :owner AND sb.status = 'WAITING_APPROVAL'")
    List<SurpriseBox> findBoxesWaitingForApprovalByOwner(@Param("owner") User owner);
    
    /**
     * Find boxes by status
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.status = :status ORDER BY sb.createdAt DESC")
    List<SurpriseBox> findByStatusOrderByCreatedAtDesc(@Param("status") SurpriseBox.BoxStatus status);
    
    /**
     * Check if user has an active box as owner
     */
    @Query("SELECT COUNT(sb) > 0 FROM SurpriseBox sb WHERE sb.owner = :owner AND sb.status NOT IN ('CLAIMED', 'EXPIRED')")
    boolean hasActiveBoxAsOwner(@Param("owner") User owner);
    
    /**
     * Find boxes that need to be re-dropped (expired but not claimed)
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.status = 'DROPPED' AND sb.expiresAt < :now AND sb.recipient = :user")
    List<SurpriseBox> findBoxesForReDrop(@Param("user") User user, @Param("now") LocalDateTime now);
    
    // Additional methods for scheduler service
    List<SurpriseBox> findByStatusAndDropAtBefore(SurpriseBox.BoxStatus status, LocalDateTime dropAt);
    
    List<SurpriseBox> findByStatusInAndExpiresAtBefore(List<SurpriseBox.BoxStatus> statuses, LocalDateTime expiresAt);
    
    List<SurpriseBox> findByStatusAndDropAtBetween(SurpriseBox.BoxStatus status, LocalDateTime start, LocalDateTime end);
    
    List<SurpriseBox> findByStatusInAndUpdatedAtBefore(List<SurpriseBox.BoxStatus> statuses, LocalDateTime updatedAt);
    
    List<SurpriseBox> findByStatusAndUpdatedAtBefore(SurpriseBox.BoxStatus status, LocalDateTime updatedAt);
    
    long countByStatusIn(List<SurpriseBox.BoxStatus> statuses);
    
    long countByStatus(SurpriseBox.BoxStatus status);
    
    /**
     * Find boxes by recipient and status
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.recipient = :recipient AND sb.status = :status ORDER BY sb.createdAt DESC")
    List<SurpriseBox> findByRecipientAndStatusOrderByCreatedAtDesc(@Param("recipient") User recipient, @Param("status") SurpriseBox.BoxStatus status);
    
    /**
     * Find dropped boxes for intermittent cycling (have nextDropTime set)
     */
    @Query("SELECT sb FROM SurpriseBox sb WHERE sb.status = 'DROPPED' AND sb.nextDropTime IS NOT NULL")
    List<SurpriseBox> findByStatusAndNextDropTimeIsNotNull();
}