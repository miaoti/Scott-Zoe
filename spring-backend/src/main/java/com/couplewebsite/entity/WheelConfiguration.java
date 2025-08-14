package com.couplewebsite.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "wheel_configurations")
@EntityListeners(AuditingEntityListener.class)
public class WheelConfiguration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User ownerUser; // The user whose wheel this is
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "configured_by_user_id", nullable = false)
    private User configuredByUser; // The user who configured this wheel
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "wheelConfiguration", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<WheelPrizeTemplate> prizeTemplates;
    
    // Constructors
    public WheelConfiguration() {}
    
    public WheelConfiguration(User ownerUser, User configuredByUser) {
        this.ownerUser = ownerUser;
        this.configuredByUser = configuredByUser;
        this.isActive = true;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getOwnerUser() {
        return ownerUser;
    }
    
    public void setOwnerUser(User ownerUser) {
        this.ownerUser = ownerUser;
    }
    
    public User getConfiguredByUser() {
        return configuredByUser;
    }
    
    public void setConfiguredByUser(User configuredByUser) {
        this.configuredByUser = configuredByUser;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
    
    public List<WheelPrizeTemplate> getPrizeTemplates() {
        return prizeTemplates;
    }
    
    public void setPrizeTemplates(List<WheelPrizeTemplate> prizeTemplates) {
        this.prizeTemplates = prizeTemplates;
    }
    
    @Override
    public String toString() {
        return "WheelConfiguration{" +
                "id=" + id +
                ", ownerUser=" + (ownerUser != null ? ownerUser.getUsername() : null) +
                ", configuredByUser=" + (configuredByUser != null ? configuredByUser.getUsername() : null) +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}