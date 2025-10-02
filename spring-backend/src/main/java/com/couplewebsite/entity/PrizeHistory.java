package com.couplewebsite.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "prize_history")
@EntityListeners(AuditingEntityListener.class)
public class PrizeHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "box_id", nullable = false)
    @NotNull(message = "Box is required")
    @JsonIgnore
    private SurpriseBox box;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @NotNull(message = "Recipient is required")
    @JsonIgnore
    private User recipient;
    
    @Column(name = "prize_name", nullable = false)
    @NotBlank(message = "Prize name is required")
    private String prizeName;
    
    @Column(name = "task_description", nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Task description is required")
    private String taskDescription;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "completion_type", nullable = false)
    @NotNull(message = "Completion type is required")
    private SurpriseBox.CompletionType completionType;
    
    @CreatedDate
    @Column(name = "claimed_at", nullable = false, updatable = false)
    private LocalDateTime claimedAt;
    
    // Constructors
    public PrizeHistory() {}
    
    public PrizeHistory(SurpriseBox box, User recipient, String prizeName, 
                       String taskDescription, SurpriseBox.CompletionType completionType) {
        this.box = box;
        this.recipient = recipient;
        this.prizeName = prizeName;
        this.taskDescription = taskDescription;
        this.completionType = completionType;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public SurpriseBox getBox() {
        return box;
    }
    
    public void setBox(SurpriseBox box) {
        this.box = box;
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
    
    public String getTaskDescription() {
        return taskDescription;
    }
    
    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }
    
    public SurpriseBox.CompletionType getCompletionType() {
        return completionType;
    }
    
    public void setCompletionType(SurpriseBox.CompletionType completionType) {
        this.completionType = completionType;
    }
    
    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }
    
    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }
    
    public String getPrizeDescription() {
        return box != null ? box.getPrizeDescription() : null;
    }
    
    public void setPrizeDescription(String prizeDescription) {
        if (box != null) {
            box.setPrizeDescription(prizeDescription);
        }
    }
    
    @Override
    public String toString() {
        return "PrizeHistory{" +
                "id=" + id +
                ", prizeName='" + prizeName + '\'' +
                ", completionType=" + completionType +
                ", claimedAt=" + claimedAt +
                '}';
    }
}