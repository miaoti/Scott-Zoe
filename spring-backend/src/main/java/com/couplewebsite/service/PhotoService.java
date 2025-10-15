package com.couplewebsite.service;

import com.couplewebsite.entity.Photo;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.PhotoRepository;
import com.couplewebsite.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PhotoService {
    
    private static final Logger logger = LoggerFactory.getLogger(PhotoService.class);
    
    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    /**
     * Upload single photo
     */
    public Photo uploadPhoto(MultipartFile file, String caption) {
        try {
            // Validate file
            if (!fileStorageService.isValidImageFile(file)) {
                throw new RuntimeException("Only image files are allowed");
            }
            
            // Get current user
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User uploader = userDetailsService.getUserByUsername(username);
            
            // Store file with multiple sizes
            String fileName = fileStorageService.storeFileWithSizes(file);
            String filePath = fileStorageService.getFilePath(fileName).toString();
            
            // Create photo entity
            Photo photo = new Photo(
                    fileName,
                    file.getOriginalFilename(),
                    filePath,
                    file.getSize(),
                    file.getContentType(),
                    uploader
            );
            
            if (caption != null && !caption.trim().isEmpty()) {
                photo.setCaption(caption.trim());
            }
            
            // Save to database
            Photo savedPhoto = photoRepository.save(photo);
            logger.info("Photo uploaded successfully: {}", fileName);
            
            return savedPhoto;
            
        } catch (Exception e) {
            logger.error("Error uploading photo", e);
            throw new RuntimeException("Failed to upload photo: " + e.getMessage());
        }
    }
    
    /**
     * Upload multiple photos
     */
    public List<Photo> uploadPhotos(List<MultipartFile> files, String uploadedBy) {
        List<Photo> uploadedPhotos = new ArrayList<>();
        List<String> uploadedFiles = new ArrayList<>();
        
        try {
            // Get uploader user
            User uploader = null;
            if (uploadedBy != null && !uploadedBy.trim().isEmpty()) {
                try {
                    uploader = userDetailsService.getUserByUsername(uploadedBy.trim());
                } catch (Exception e) {
                    logger.warn("User not found: {}, using anonymous", uploadedBy);
                }
            }
            
            // If no valid uploader found, use current authenticated user
            if (uploader == null) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                uploader = userDetailsService.getUserByUsername(username);
            }
            
            // Process each file
            for (MultipartFile file : files) {
                try {
                    if (!fileStorageService.isValidImageFile(file)) {
                        logger.warn("Skipping invalid file: {}", file.getOriginalFilename());
                        continue;
                    }
                    
                    // Store file with multiple sizes
                    String fileName = fileStorageService.storeFileWithSizes(file);
                    uploadedFiles.add(fileName);
                    String filePath = fileStorageService.getFilePath(fileName).toString();
                    
                    // Create photo entity
                    Photo photo = new Photo(
                            fileName,
                            file.getOriginalFilename(),
                            filePath,
                            file.getSize(),
                            file.getContentType(),
                            uploader
                    );
                    
                    // Save to database
                    Photo savedPhoto = photoRepository.save(photo);
                    uploadedPhotos.add(savedPhoto);
                    
                } catch (Exception e) {
                    logger.error("Error processing file: {}", file.getOriginalFilename(), e);
                    // Continue with other files
                }
            }
            
            logger.info("Successfully uploaded {} photos", uploadedPhotos.size());
            return uploadedPhotos;
            
        } catch (Exception e) {
            // Clean up uploaded files on error
            for (String fileName : uploadedFiles) {
                fileStorageService.deleteFile(fileName);
            }
            
            logger.error("Error uploading multiple photos", e);
            throw new RuntimeException("Failed to upload photos: " + e.getMessage());
        }
    }
    
    /**
     * Get all non-deleted photos with pagination
     */
    public Page<Photo> getAllPhotos(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)); // Limit to 50 per page
        return photoRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * Get all photos (including deleted ones) for debugging
     */
    public List<Photo> getAllPhotos() {
        return photoRepository.findAll();
    }
    
    /**
     * Get all deleted photos with pagination (recycle bin)
     */
    public Page<Photo> getDeletedPhotos(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)); // Limit to 50 per page
        return photoRepository.findByIsDeletedTrueOrderByDeletedAtDesc(pageable);
    }
    
    /**
     * Get non-deleted photo by ID with details
     */
    public Optional<Photo> getPhotoById(Long id) {
        return photoRepository.findByIdAndIsDeletedFalseWithDetails(id);
    }
    
    /**
     * Get deleted photo by ID with details (for recycle bin)
     */
    public Optional<Photo> getDeletedPhotoById(Long id) {
        return photoRepository.findByIdAndIsDeletedTrueWithDetails(id);
    }
    
    /**
     * Update photo caption
     */
    public Photo updatePhotoCaption(Long id, String caption) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photo not found"));

        photo.setCaption(caption);
        return photoRepository.save(photo);
    }


    
    /**
     * Soft delete photo (move to recycle bin)
     */
    public boolean deletePhoto(Long id) {
        try {
            Optional<Photo> photoOpt = photoRepository.findByIdAndIsDeletedFalseWithDetails(id);
            if (photoOpt.isPresent()) {
                Photo photo = photoOpt.get();
                
                // Mark as deleted
                photo.setIsDeleted(true);
                photo.setDeletedAt(java.time.LocalDateTime.now());
                
                photoRepository.save(photo);
                
                logger.info("Photo moved to recycle bin: {}", photo.getFilename());
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error moving photo to recycle bin with ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * Recover photo from recycle bin
     */
    public boolean recoverPhoto(Long id) {
        try {
            Optional<Photo> photoOpt = photoRepository.findByIdAndIsDeletedTrueWithDetails(id);
            if (photoOpt.isPresent()) {
                Photo photo = photoOpt.get();
                
                // Mark as not deleted
                photo.setIsDeleted(false);
                photo.setDeletedAt(null);
                
                photoRepository.save(photo);
                
                logger.info("Photo recovered from recycle bin: {}", photo.getFilename());
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error recovering photo with ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * Permanently delete photo from recycle bin
     */
    public boolean permanentlyDeletePhoto(Long id) {
        try {
            Optional<Photo> photoOpt = photoRepository.findByIdAndIsDeletedTrueWithDetails(id);
            if (photoOpt.isPresent()) {
                Photo photo = photoOpt.get();
                
                // Delete file from storage
                fileStorageService.deleteFile(photo.getFilename());
                
                // Delete from database
                photoRepository.delete(photo);
                
                logger.info("Photo permanently deleted: {}", photo.getFilename());
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error permanently deleting photo with ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * Bulk recover photos from recycle bin
     */
    public int bulkRecoverPhotos(List<Long> photoIds) {
        try {
            List<Photo> deletedPhotos = photoRepository.findByIdInAndIsDeletedTrue(photoIds);
            int recoveredCount = 0;
            
            for (Photo photo : deletedPhotos) {
                photo.setIsDeleted(false);
                photo.setDeletedAt(null);
                photoRepository.save(photo);
                recoveredCount++;
            }
            
            logger.info("Bulk recovered {} photos from recycle bin", recoveredCount);
            return recoveredCount;
        } catch (Exception e) {
            logger.error("Error bulk recovering photos", e);
            return 0;
        }
    }
    
    /**
     * Bulk permanently delete photos from recycle bin
     */
    public int bulkPermanentlyDeletePhotos(List<Long> photoIds) {
        try {
            List<Photo> deletedPhotos = photoRepository.findByIdInAndIsDeletedTrue(photoIds);
            int deletedCount = 0;
            
            for (Photo photo : deletedPhotos) {
                // Delete file from storage
                fileStorageService.deleteFile(photo.getFilename());
                
                // Delete from database
                photoRepository.delete(photo);
                deletedCount++;
            }
            
            logger.info("Bulk permanently deleted {} photos", deletedCount);
            return deletedCount;
        } catch (Exception e) {
            logger.error("Error bulk permanently deleting photos", e);
            return 0;
        }
    }

    public Photo updatePhotoCategories(Long photoId, List<Long> categoryIds) {
        Optional<Photo> photoOpt = photoRepository.findById(photoId);
        if (photoOpt.isPresent()) {
            Photo photo = photoOpt.get();

            // Clear existing categories
            photo.getCategories().clear();

            // Add new categories
            if (categoryIds != null && !categoryIds.isEmpty()) {
                for (Long categoryId : categoryIds) {
                    Optional<com.couplewebsite.entity.Category> categoryOpt = categoryService.getCategoryById(categoryId);
                    if (categoryOpt.isPresent()) {
                        photo.addCategory(categoryOpt.get());
                    }
                }
            }

            return photoRepository.save(photo);
        }
        throw new RuntimeException("Photo not found with id: " + photoId);
    }

    /**
     * Toggle photo favorite status
     */
    public Photo toggleFavorite(Long photoId, boolean favorite) {
        Optional<Photo> photoOpt = photoRepository.findById(photoId);
        if (photoOpt.isPresent()) {
            Photo photo = photoOpt.get();
            photo.setIsFavorite(favorite);
            return photoRepository.save(photo);
        }
        throw new RuntimeException("Photo not found with id: " + photoId);
    }

    /**
     * Get all favorite photos
     */
    public List<Photo> getFavoritePhotos() {
        return photoRepository.findByIsFavoriteTrue();
    }
    
    /**
     * Get favorite photos with pagination
     */
    public Page<Photo> getFavoritePhotos(int page, int size) {
        // Limit page size to prevent excessive memory usage
        if (size > 50) {
            size = 50;
        }
        Pageable pageable = PageRequest.of(page, size);
        return photoRepository.findByIsFavoriteTrueOrderByCreatedAtDesc(pageable);
    }

    /**
     * Bulk delete photos
     */
    public int bulkDeletePhotos(List<Long> photoIds) {
        int deletedCount = 0;
        for (Long photoId : photoIds) {
            try {
                if (deletePhoto(photoId)) {
                    deletedCount++;
                }
            } catch (Exception e) {
                logger.error("Error deleting photo with ID: {}", photoId, e);
            }
        }
        return deletedCount;
    }

    /**
     * Bulk update photo categories
     */
    public int bulkUpdatePhotoCategories(List<Long> photoIds, List<Long> categoryIds) {
        int updatedCount = 0;
        for (Long photoId : photoIds) {
            try {
                updatePhotoCategories(photoId, categoryIds);
                updatedCount++;
            } catch (Exception e) {
                logger.error("Error updating categories for photo with ID: {}", photoId, e);
            }
        }
        return updatedCount;
    }

    /**
     * Save photo (for updating favorite status, caption, etc.)
     */
    public Photo savePhoto(Photo photo) {
        return photoRepository.save(photo);
    }
    
    /**
     * Scheduled task to automatically delete photos from recycle bin after 7 days
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupOldDeletedPhotos() {
        try {
            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            List<Photo> oldDeletedPhotos = photoRepository.findByIsDeletedTrueAndDeletedAtBefore(oneWeekAgo);
            
            int deletedCount = 0;
            for (Photo photo : oldDeletedPhotos) {
                try {
                    // Delete file from storage
                    fileStorageService.deleteFile(photo.getFilename());
                    
                    // Delete from database
                    photoRepository.delete(photo);
                    
                    deletedCount++;
                    logger.info("Auto-deleted old photo from recycle bin: {}", photo.getFilename());
                } catch (Exception e) {
                    logger.error("Error auto-deleting photo: {}", photo.getFilename(), e);
                }
            }
            
            if (deletedCount > 0) {
                logger.info("Auto-cleanup completed: {} photos permanently deleted from recycle bin", deletedCount);
            }
            
        } catch (Exception e) {
            logger.error("Error during scheduled cleanup of old deleted photos", e);
        }
    }
}
