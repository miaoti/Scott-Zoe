package com.couplewebsite.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wheel_prize_templates")
@EntityListeners(AuditingEntityListener.class)
public class WheelPrizeTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wheel_configuration_id", nullable = false)
    private WheelConfiguration wheelConfiguration;
    
    @Column(name = "prize_name", nullable = false, length = 100)
    private String prizeName;
    
    @Column(name = "prize_description", length = 255)
    private String prizeDescription;
    
    @Column(name = "prize_type", nullable = false, length = 50)
    private String prizeType; // "MONEY", "CUSTOM"
    
    @Column(name = "prize_value", nullable = false)
    private Integer prizeValue; // For money prizes, this is the amount
    
    @Column(name = "probability", nullable = false, precision = 5, scale = 2)
    private BigDecimal probability; // Percentage (0.00 to 100.00)
    
    @Column(name = "color", nullable = false, length = 7)
    private String color; // Hex color code
    
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public WheelPrizeTemplate() {}
    
    public WheelPrizeTemplate(WheelConfiguration wheelConfiguration, String prizeName, 
                             String prizeDescription, String prizeType, Integer prizeValue, 
                             BigDecimal probability, String color, Integer displayOrder) {
        this.wheelConfiguration = wheelConfiguration;
        this.prizeName = prizeName;
        this.prizeDescription = prizeDescription;
        this.prizeType = prizeType;
        this.prizeValue = prizeValue;
        this.probability = probability;
        this.color = color;
        this.displayOrder = displayOrder;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public WheelConfiguration getWheelConfiguration() {
        return wheelConfiguration;
    }
    
    public void setWheelConfiguration(WheelConfiguration wheelConfiguration) {
        this.wheelConfiguration = wheelConfiguration;
    }
    
    public String getPrizeName() {
        return prizeName;
    }
    
    public void setPrizeName(String prizeName) {
        this.prizeName = prizeName;
    }
    
    public String getPrizeDescription() {
        return prizeDescription;
    }
    
    public void setPrizeDescription(String prizeDescription) {
        this.prizeDescription = prizeDescription;
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
    
    public BigDecimal getProbability() {
        return probability;
    }
    
    public void setProbability(BigDecimal probability) {
        this.probability = probability;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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
    
    @Override
    public String toString() {
        return "WheelPrizeTemplate{" +
                "id=" + id +
                ", prizeName='" + prizeName + '\'' +
                ", prizeType='" + prizeType + '\'' +
                ", prizeValue=" + prizeValue +
                ", probability=" + probability +
                ", color='" + color + '\'' +
                ", displayOrder=" + displayOrder +
                '}';
    }
}