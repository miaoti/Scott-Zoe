package com.couplewebsite.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "memories")
@EntityListeners(AuditingEntityListener.class)
public class Memory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Title is required")
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Description is required")
    private String description;
    
    @Column(nullable = false)
    @NotNull(message = "Date is required")
    private LocalDate date;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemoryType type = MemoryType.SPECIAL_MOMENT;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @NotNull(message = "Creator is required")
    private User creator;
    
    // Many-to-many relationship with photos (only for EVENT type)
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "memory_photos",
        joinColumns = @JoinColumn(name = "memory_id"),
        inverseJoinColumns = @JoinColumn(name = "photo_id")
    )
    @JsonIgnore
    private Set<Photo> photos = new HashSet<>();
    
    // Enum for memory types
    public enum MemoryType {
        ANNIVERSARY("anniversary"),
        SPECIAL_MOMENT("special_moment"),
        MILESTONE("milestone"),
        EVENT("event");
        
        private final String value;
        
        MemoryType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static MemoryType fromValue(String value) {
            for (MemoryType type : MemoryType.values()) {
                if (type.value.equals(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown memory type: " + value);
        }
    }
    
    // Constructors
    public Memory() {}
    
    public Memory(String title, String description, LocalDate date, MemoryType type, User creator) {
        this.title = title;
        this.description = description;
        this.date = date;
        this.type = type;
        this.creator = creator;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public MemoryType getType() {
        return type;
    }
    
    public void setType(MemoryType type) {
        this.type = type;
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
    
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }
    
    public Set<Photo> getPhotos() {
        return photos;
    }
    
    public void setPhotos(Set<Photo> photos) {
        this.photos = photos;
    }
    
    public void addPhoto(Photo photo) {
        this.photos.add(photo);
    }
    
    public void removePhoto(Photo photo) {
        this.photos.remove(photo);
    }
    
    @Override
    public String toString() {
        return "Memory{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", date=" + date +
                ", type=" + type +
                '}';
    }
}
