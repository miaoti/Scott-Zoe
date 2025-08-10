package com.couplewebsite.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "earnings")
public class Earnings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private Integer totalAfter;

    @Column(nullable = false)
    private String source; // e.g., "prize_wheel", "daily_bonus", etc.

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Earnings() {
        this.createdAt = LocalDateTime.now();
    }

    public Earnings(User user, Integer amount, Integer totalAfter, String source) {
        this();
        this.user = user;
        this.amount = amount;
        this.totalAfter = totalAfter;
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

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public Integer getTotalAfter() {
        return totalAfter;
    }

    public void setTotalAfter(Integer totalAfter) {
        this.totalAfter = totalAfter;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
