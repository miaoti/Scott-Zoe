package com.couplewebsite.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "wheel_prizes")
@EntityListeners(AuditingEntityListener.class)
public class WheelPrize {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "prize_type", nullable = false)
    private String prizeType;
    
    @Column(name = "prize_value", nullable = false)
    private Integer prizeValue;
    
    @Column(name = "prize_description")
    private String prizeDescription;
    
    @CreatedDate
    @Column(name = "won_at", nullable = false, updatable = false)
    private LocalDateTime wonAt;
    
    // Constructors
    public WheelPrize() {}
    
    public WheelPrize(User user, String prizeType, Integer prizeValue, String prizeDescription) {
        this.user = user;
        this.prizeType = prizeType;
        this.prizeValue = prizeValue;
        this.prizeDescription = prizeDescription;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getPrizeType() {
        return prizeType;
    }
    
    public void setPrizeType(String prizeType) {
        this.prizeType = prizeType;
    }
    
    public Integer getPrizeValue() {
        return prizeValue;
    }
    
    public void setPrizeValue(Integer prizeValue) {
        this.prizeValue = prizeValue;
    }
    
    public String getPrizeDescription() {
        return prizeDescription;
    }
    
    public void setPrizeDescription(String prizeDescription) {
        this.prizeDescription = prizeDescription;
    }
    
    public LocalDateTime getWonAt() {
        return wonAt;
    }
    
    public void setWonAt(LocalDateTime wonAt) {
        this.wonAt = wonAt;
    }
    
    @Override
    public String toString() {
        return "WheelPrize{" +
                "id=" + id +
                ", prizeType='" + prizeType + '\'' +
                ", prizeValue=" + prizeValue +
                ", prizeDescription='" + prizeDescription + '\'' +
                ", wonAt=" + wonAt +
                '}';
    }
}