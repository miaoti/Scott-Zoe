package com.couplewebsite.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "surprise_boxes")
@EntityListeners(AuditingEntityListener.class)
public class SurpriseBox {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @NotNull(message = "Owner is required")
    @JsonIgnore
    private User owner;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @NotNull(message = "Recipient is required")
    @JsonIgnore
    private User recipient;
    
    @Column(name = "prize_name", nullable = false)
    @NotBlank(message = "Prize name is required")
    private String prizeName;
    
    @Column(name = "price_amount", nullable = true, precision = 10, scale = 2)
    private BigDecimal priceAmount;
    
    @Column(name = "task_description", nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Task description is required")
    private String taskDescription;
    
    @Column(name = "expiration_minutes", nullable = false)
    @Min(value = 1, message = "Expiration minutes must be at least 1")
    private Integer expirationMinutes = 60;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BoxStatus status = BoxStatus.CREATED;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "opened_at")
    private LocalDateTime openedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "completion_type")
    private CompletionType completionType;
    
    @Column(name = "prize_description", columnDefinition = "TEXT")
    private String prizeDescription;
    
    @Column(name = "completion_data", columnDefinition = "TEXT")
    private String completionData;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "dropped_at")
    private LocalDateTime droppedAt;
    
    @Column(name = "drop_at")
    private LocalDateTime dropAt;
    
    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;
    
    // Intermittent dropping fields
    @Column(name = "drop_duration_minutes")
    private Integer dropDurationMinutes = 3; // Default: drop for 3 minutes
    
    @Column(name = "pause_duration_minutes")
    private Integer pauseDurationMinutes = 5; // Default: pause for 5 minutes
    
    @Column(name = "next_drop_time")
    private LocalDateTime nextDropTime;
    
    @Column(name = "is_dropping")
    private Boolean isDropping = false; // Whether currently in dropping phase
    
    // Drop scheduling fields
    @Column(name = "is_instant_drop")
    private Boolean isInstantDrop = true; // Default to instant drop
    
    @Column(name = "scheduled_drop_time")
    private LocalDateTime scheduledDropTime; // When to auto-drop the box (for "Drop Later" option)
    
    @OneToMany(mappedBy = "box", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PrizeHistory> prizeHistories = new ArrayList<>();
    
    // Constructors
    public SurpriseBox() {}
    
    public SurpriseBox(User owner, User recipient, String prizeName, BigDecimal priceAmount, 
                      String taskDescription, Integer expirationMinutes) {
        this.owner = owner;
        this.recipient = recipient;
        this.prizeName = prizeName;
        this.priceAmount = priceAmount;
        this.taskDescription = taskDescription;
        this.expirationMinutes = expirationMinutes;
    }
    
    // Enums
    public enum BoxStatus {
        CREATED, DROPPED, OPENED, WAITING_APPROVAL, APPROVED, REJECTED, EXPIRED, CLAIMED
    }
    
    public enum CompletionType {
        TASK, PAYMENT, LOCATION, TIME, PHOTO
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getOwner() {
        return owner;
    }
    
    public void setOwner(User owner) {
        this.owner = owner;
    }
    
    public User getRecipient() {
        return recipient;
    }
    
    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }
    
    public String getPrizeName() {
        return prizeName;
    }
    
    public void setPrizeName(String prizeName) {
        this.prizeName = prizeName;
    }
    
    public BigDecimal getPriceAmount() {
        return priceAmount;
    }
    
    public void setPriceAmount(BigDecimal priceAmount) {
        this.priceAmount = priceAmount;
    }
    
    public String getTaskDescription() {
        return taskDescription;
    }
    
    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }
    
    public Integer getExpirationMinutes() {
        return expirationMinutes;
    }
    
    public void setExpirationMinutes(Integer expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }
    
    public BoxStatus getStatus() {
        return status;
    }
    
    public void setStatus(BoxStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getOpenedAt() {
        return openedAt;
    }
    
    public void setOpenedAt(LocalDateTime openedAt) {
        this.openedAt = openedAt;
    }
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
    
    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public CompletionType getCompletionType() {
        return completionType;
    }
    
    public void setCompletionType(CompletionType completionType) {
        this.completionType = completionType;
    }
    
    public List<PrizeHistory> getPrizeHistories() {
        return prizeHistories;
    }
    
    public void setPrizeHistories(List<PrizeHistory> prizeHistories) {
        this.prizeHistories = prizeHistories;
    }
    
    public String getPrizeDescription() {
        return prizeDescription;
    }
    
    public void setPrizeDescription(String prizeDescription) {
        this.prizeDescription = prizeDescription;
    }
    
    public String getCompletionData() {
        return completionData;
    }
    
    public void setCompletionData(String completionData) {
        this.completionData = completionData;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public LocalDateTime getDroppedAt() {
        return droppedAt;
    }
    
    public void setDroppedAt(LocalDateTime droppedAt) {
        this.droppedAt = droppedAt;
    }
    
    public LocalDateTime getDropAt() {
        return dropAt;
    }
    
    public void setDropAt(LocalDateTime dropAt) {
        this.dropAt = dropAt;
    }
    
    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }
    
    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }
    
    public Integer getDropDurationMinutes() {
        return dropDurationMinutes;
    }
    
    public void setDropDurationMinutes(Integer dropDurationMinutes) {
        this.dropDurationMinutes = dropDurationMinutes;
    }
    
    public Integer getPauseDurationMinutes() {
        return pauseDurationMinutes;
    }
    
    public void setPauseDurationMinutes(Integer pauseDurationMinutes) {
        this.pauseDurationMinutes = pauseDurationMinutes;
    }
    
    public LocalDateTime getNextDropTime() {
        return nextDropTime;
    }
    
    public void setNextDropTime(LocalDateTime nextDropTime) {
        this.nextDropTime = nextDropTime;
    }
    
    public Boolean getIsDropping() {
        return isDropping;
    }
    
    public void setIsDropping(Boolean isDropping) {
        this.isDropping = isDropping;
    }
    
    public Boolean getIsInstantDrop() {
        return isInstantDrop;
    }
    
    public void setIsInstantDrop(Boolean isInstantDrop) {
        this.isInstantDrop = isInstantDrop;
    }
    
    public LocalDateTime getScheduledDropTime() {
        return scheduledDropTime;
    }
    
    public void setScheduledDropTime(LocalDateTime scheduledDropTime) {
        this.scheduledDropTime = scheduledDropTime;
    }
    
    // Helper methods
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean canBeApproved() {
        return status == BoxStatus.WAITING_APPROVAL;
    }
    
    public boolean canBeCompleted() {
        return status == BoxStatus.OPENED && !isExpired();
    }
    
    @Override
    public String toString() {
        return "SurpriseBox{" +
                "id=" + id +
                ", prizeName='" + prizeName + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}