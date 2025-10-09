package com.couplewebsite.dto;

import com.couplewebsite.entity.NoteOperation;
import java.time.LocalDateTime;

public class NoteOperationDto {
    private Long id;
    private Long noteId;
    private Long userId;
    private NoteOperation.OperationType operationType;
    private Integer position;
    private String content;
    private Integer length;
    private LocalDateTime createdAt;
    private Integer sequenceNumber;
    private String clientId;
    private Integer revision;
    
    // Constructors
    public NoteOperationDto() {}
    
    public NoteOperationDto(Long id, Long noteId, Long userId, NoteOperation.OperationType operationType,
                           Integer position, String content, Integer length, LocalDateTime createdAt, Integer sequenceNumber, String clientId) {
        this.id = id;
        this.noteId = noteId;
        this.userId = userId;
        this.operationType = operationType;
        this.position = position;
        this.content = content;
        this.length = length;
        this.createdAt = createdAt;
        this.sequenceNumber = sequenceNumber;
        this.clientId = clientId;
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
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public NoteOperation.OperationType getOperationType() {
        return operationType;
    }
    
    public void setOperationType(NoteOperation.OperationType operationType) {
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
    
    public String getClientId() {
        return clientId;
    }
    
    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
    
    public Integer getRevision() {
        return revision;
    }
    
    public void setRevision(Integer revision) {
        this.revision = revision;
    }
}