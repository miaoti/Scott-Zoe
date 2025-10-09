package com.couplewebsite.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "edit_sessions")
public class EditSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "note_id", nullable = false)
    private Long noteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_editor_id")
    private User currentEditor;

    @Column(name = "lock_acquired_at")
    private LocalDateTime lockAcquiredAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id")
    private User requestedByUser;

    @Column(name = "request_expires_at")
    private LocalDateTime requestExpiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public EditSession() {}

    public EditSession(Long noteId) {
        this.noteId = noteId;
        this.isActive = false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public User getCurrentEditor() {
        return currentEditor;
    }

    public void setCurrentEditor(User currentEditor) {
        this.currentEditor = currentEditor;
    }

    public LocalDateTime getLockAcquiredAt() {
        return lockAcquiredAt;
    }

    public void setLockAcquiredAt(LocalDateTime lockAcquiredAt) {
        this.lockAcquiredAt = lockAcquiredAt;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public User getRequestedByUser() {
        return requestedByUser;
    }

    public void setRequestedByUser(User requestedByUser) {
        this.requestedByUser = requestedByUser;
    }

    public LocalDateTime getRequestExpiresAt() {
        return requestExpiresAt;
    }

    public void setRequestExpiresAt(LocalDateTime requestExpiresAt) {
        this.requestExpiresAt = requestExpiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Helper methods
    public boolean isExpired() {
        if (lastActivityAt == null) return false;
        return lastActivityAt.isBefore(LocalDateTime.now().minusMinutes(2));
    }

    public boolean isRequestExpired() {
        if (requestExpiresAt == null) return false;
        return requestExpiresAt.isBefore(LocalDateTime.now());
    }
}