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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
            
            // Store file
            String fileName = fileStorageService.storeFile(file);
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
                    
                    // Store file
                    String fileName = fileStorageService.storeFile(file);
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
     * Get all photos with pagination
     */
    public Page<Photo> getAllPhotos(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)); // Limit to 50 per page
        return photoRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * Get photo by ID with details
     */
    public Optional<Photo> getPhotoById(Long id) {
        return photoRepository.findByIdWithDetails(id);
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
     * Delete photo
     */
    public boolean deletePhoto(Long id) {
        try {
            Optional<Photo> photoOpt = photoRepository.findById(id);
            if (photoOpt.isPresent()) {
                Photo photo = photoOpt.get();
                
                // Delete file from storage
                fileStorageService.deleteFile(photo.getFilename());
                
                // Delete from database
                photoRepository.delete(photo);
                
                logger.info("Photo deleted successfully: {}", photo.getFilename());
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error deleting photo with ID: {}", id, e);
            return false;
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
     * Get all favorite photos
     */
    public List<Photo> getFavoritePhotos() {
        return photoRepository.findByIsFavoriteTrue();
    }

    /**
     * Save photo (for updating favorite status, caption, etc.)
     */
    public Photo savePhoto(Photo photo) {
        return photoRepository.save(photo);
    }
}
