package com.couplewebsite.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wheel_usage")
public class WheelUsage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;
    
    @Column(name = "week_start", nullable = false)
    private LocalDateTime weekStart;
    
    @Column(name = "prize_amount")
    private Integer prizeAmount;
    
    @Column(name = "source", nullable = false)
    private String source; // "weekly", "milestone_reward", "saved_opportunity"
    
    // Constructors
    public WheelUsage() {
        this.usedAt = LocalDateTime.now();
    }
    
    public WheelUsage(User user, LocalDateTime weekStart, Integer prizeAmount, String source) {
        this();
        this.user = user;
        this.weekStart = weekStart;
        this.prizeAmount = prizeAmount;
        this.source = source;
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
    
    public LocalDateTime getUsedAt() {
        return usedAt;
    }
    
    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
    
    public LocalDateTime getWeekStart() {
        return weekStart;
    }
    
    public void setWeekStart(LocalDateTime weekStart) {
        this.weekStart = weekStart;
    }
    
    public Integer getPrizeAmount() {
        return prizeAmount;
    }
    
    public void setPrizeAmount(Integer prizeAmount) {
        this.prizeAmount = prizeAmount;
    }
    
    public String getSource() {
        return source;
    }
    
    public void setSource(String source) {
        this.source = source;
    }
    
    @Override
    public String toString() {
        return "WheelUsage{" +
                "id=" + id +
                ", usedAt=" + usedAt +
                ", weekStart=" + weekStart +
                ", prizeAmount=" + prizeAmount +
                ", source='" + source + '\'' +
                '}';
    }
}
