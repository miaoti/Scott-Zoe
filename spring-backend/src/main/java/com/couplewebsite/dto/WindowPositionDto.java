package com.couplewebsite.dto;

import java.time.LocalDateTime;

public class WindowPositionDto {
    private Long id;
    private Long userId;
    private Integer xPosition;
    private Integer yPosition;
    private Integer width;
    private Integer height;
    private LocalDateTime updatedAt;
    
    // Constructors
    public WindowPositionDto() {}
    
    public WindowPositionDto(Long id, Long userId, Integer xPosition, Integer yPosition, 
                            Integer width, Integer height, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.xPosition = xPosition;
        this.yPosition = yPosition;
        this.width = width;
        this.height = height;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
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
}