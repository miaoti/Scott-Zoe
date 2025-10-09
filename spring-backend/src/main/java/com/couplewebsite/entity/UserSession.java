package com.couplewebsite.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
public class UserSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "is_connected", nullable = false)
    private Boolean isConnected = true;

    @Column(name = "connected_at", nullable = false)
    private LocalDateTime connectedAt;

    @Column(name = "last_ping_at", nullable = false)
    private LocalDateTime lastPingAt;

    @PrePersist
    protected void onCreate() {
        connectedAt = LocalDateTime.now();
        lastPingAt = LocalDateTime.now();
    }

    // Constructors
    public UserSession() {}

    public UserSession(User user, String sessionId) {
        this.user = user;
        this.sessionId = sessionId;
        this.isConnected = true;
        this.connectedAt = LocalDateTime.now();
        this.lastPingAt = LocalDateTime.now();
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

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Boolean getIsConnected() {
        return isConnected;
    }

    public void setIsConnected(Boolean isConnected) {
        this.isConnected = isConnected;
    }

    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(LocalDateTime connectedAt) {
        this.connectedAt = connectedAt;
    }

    public LocalDateTime getLastPingAt() {
        return lastPingAt;
    }

    public void setLastPingAt(LocalDateTime lastPingAt) {
        this.lastPingAt = lastPingAt;
    }

    // Helper methods
    public boolean isDisconnected() {
        if (lastPingAt == null) return true;
        return lastPingAt.isBefore(LocalDateTime.now().minusSeconds(30));
    }

    public void updatePing() {
        this.lastPingAt = LocalDateTime.now();
    }
}