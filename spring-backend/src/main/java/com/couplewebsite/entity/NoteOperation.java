package com.couplewebsite.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_operations")
@EntityListeners(AuditingEntityListener.class)
public class NoteOperation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private SharedNote note;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "operation_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private OperationType operationType;
    
    @Column(nullable = false)
    private Integer position;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column
    private Integer length;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;
    
    public enum OperationType {
        INSERT, DELETE, RETAIN
    }
    
    // Constructors
    public NoteOperation() {}
    
    public NoteOperation(SharedNote note, User user, OperationType operationType, 
                        Integer position, String content, Integer length, Integer sequenceNumber) {
        this.note = note;
        this.user = user;
        this.operationType = operationType;
        this.position = position;
        this.content = content;
        this.length = length;
        this.sequenceNumber = sequenceNumber;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public SharedNote getNote() {
        return note;
    }
    
    public void setNote(SharedNote note) {
        this.note = note;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public OperationType getOperationType() {
        return operationType;
    }
    
    public void setOperationType(OperationType operationType) {
        this.operationType = operationType;
    }
    
    public Integer getPosition() {
        return position;
    }
    
    public void setPosition(Integer position) {
        this.position = position;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Integer getLength() {
        return length;
    }
    
    public void setLength(Integer length) {
        this.length = length;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Integer getSequenceNumber() {
        return sequenceNumber;
    }
    
    public void setSequenceNumber(Integer sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }
    
    @Override
    public String toString() {
        return "NoteOperation{" +
                "id=" + id +
                ", operationType=" + operationType +
                ", position=" + position +
                ", content='" + content + '\'' +
                ", length=" + length +
                ", sequenceNumber=" + sequenceNumber +
                '}';
    }
}