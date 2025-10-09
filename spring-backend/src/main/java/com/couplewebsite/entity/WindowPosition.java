package com.couplewebsite.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "window_positions")
@EntityListeners(AuditingEntityListener.class)
public class WindowPosition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "x_position", nullable = false)
    private Integer xPosition = 100;
    
    @Column(name = "y_position", nullable = false)
    private Integer yPosition = 100;
    
    @Column(nullable = false)
    private Integer width = 300;
    
    @Column(nullable = false)
    private Integer height = 400;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public WindowPosition() {}
    
    public WindowPosition(User user, Integer xPosition, Integer yPosition, Integer width, Integer height) {
        this.user = user;
        this.xPosition = xPosition;
        this.yPosition = yPosition;
        this.width = width;
        this.height = height;
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
    
    public Integer getXPosition() {
        return xPosition;
    }
    
    public void setXPosition(Integer xPosition) {
        this.xPosition = xPosition;
    }
    
    public Integer getYPosition() {
        return yPosition;
    }
    
    public void setYPosition(Integer yPosition) {
        this.yPosition = yPosition;
    }
    
    public Integer getWidth() {
        return width;
    }
    
    public void setWidth(Integer width) {
        this.width = width;
    }
    
    public Integer getHeight() {
        return height;
    }
    
    public void setHeight(Integer height) {
        this.height = height;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "WindowPosition{" +
                "id=" + id +
                ", xPosition=" + xPosition +
                ", yPosition=" + yPosition +
                ", width=" + width +
                ", height=" + height +
                ", updatedAt=" + updatedAt +
                '}';
    }
}