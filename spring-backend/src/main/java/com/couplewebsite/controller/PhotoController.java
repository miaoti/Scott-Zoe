package com.couplewebsite.controller;

import com.couplewebsite.entity.Photo;
import com.couplewebsite.service.PhotoService;
import com.couplewebsite.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")

public class PhotoController {
    
    private static final Logger logger = LoggerFactory.getLogger(PhotoController.class);
    
    @Autowired
    private PhotoService photoService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    /**
     * Upload single photo
     */
    @PostMapping("/upload-single")
    public ResponseEntity<?> uploadSinglePhoto(
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        
        try {
            Photo photo = photoService.uploadPhoto(file, caption);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Photo uploaded successfully");
            response.put("photo", createPhotoResponse(photo));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error uploading single photo", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during upload: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Upload multiple photos
     */
    @PostMapping({"/upload", "/upload-multiple"})
    public ResponseEntity<?> uploadMultiplePhotos(
            HttpServletRequest request,
            @RequestParam("photos") List<MultipartFile> files,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy) {
        
        try {
            // Debug logging for multipart request
            logger.info("Content-Type: {}", request.getContentType());
            logger.info("Content-Length: {}", request.getContentLength());
            logger.info("Is multipart: {}", request.getContentType() != null && request.getContentType().startsWith("multipart/"));
            
            if (files == null || files.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No files uploaded");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Photo> photos = photoService.uploadPhotos(files, uploadedBy);
            
            if (photos.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Failed to upload any photos");
                return ResponseEntity.status(500).body(error);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", photos.size() + " photo(s) uploaded successfully");
            response.put("photos", photos.stream()
                    .map(this::createPhotoResponse)
                    .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error uploading multiple photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during upload: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all photos with pagination
     */
    @GetMapping
    public ResponseEntity<?> getAllPhotos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        
        try {
            logger.info("Fetching photos with page={}, limit={}", page, limit);
            Page<Photo> photoPage = photoService.getAllPhotos(page, limit);
            logger.info("Found {} photos, total elements: {}", photoPage.getContent().size(), photoPage.getTotalElements());
            
            Map<String, Object> response = new HashMap<>();
            response.put("photos", photoPage.getContent().stream()
                    .map(this::createPhotoResponseWithStats)
                    .collect(Collectors.toList()));
            
            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", page);
            pagination.put("limit", limit);
            pagination.put("total", photoPage.getTotalElements());
            pagination.put("totalPages", photoPage.getTotalPages());
            response.put("pagination", pagination);
            
            logger.info("Returning response with {} photos", photoPage.getContent().size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get photo by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPhotoById(@PathVariable Long id) {
        try {
            Optional<Photo> photoOpt = photoService.getPhotoById(id);
            
            if (photoOpt.isPresent()) {
                return ResponseEntity.ok(createPhotoResponseWithDetails(photoOpt.get()));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Photo not found");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching photo by ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Update photo caption
     */
    @PutMapping("/{id}/caption")
    public ResponseEntity<?> updatePhotoCaption(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        try {
            String caption = request.get("caption");
            Photo updatedPhoto = photoService.updatePhotoCaption(id, caption);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Caption updated successfully");
            response.put("photo", createPhotoResponse(updatedPhoto));
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Error updating photo caption for ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    


    /**
     * Delete photo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        try {
            boolean deleted = photoService.deletePhoto(id);

            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Photo deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Photo not found");
                return ResponseEntity.status(404).body(error);
            }

        } catch (Exception e) {
            logger.error("Error deleting photo with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Helper methods for creating responses
    private Map<String, Object> createPhotoResponse(Photo photo) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", photo.getId());
        response.put("filename", photo.getFilename());
        response.put("originalName", photo.getOriginalName());
        response.put("caption", photo.getCaption());
        response.put("createdAt", photo.getCreatedAt());
        return response;
    }
    
    private Map<String, Object> createPhotoResponseWithStats(Photo photo) {
        Map<String, Object> response = createPhotoResponse(photo);
        response.put("path", photo.getPath());
        response.put("size", photo.getSize());
        response.put("mimeType", photo.getMimeType());
        response.put("updatedAt", photo.getUpdatedAt());
        response.put("deletedAt", photo.getDeletedAt());
        response.put("uploader", photo.getUploader() != null ? 
                Map.of("name", photo.getUploader().getName()) : null);
        response.put("categories", photo.getCategories().stream()
                .map(cat -> Map.of("id", cat.getId(), "name", cat.getName(), "color", cat.getColor()))
                .collect(Collectors.toList()));
        response.put("noteCount", photo.getNotes().size());
        response.put("isFavorite", photo.getIsFavorite() != null ? photo.getIsFavorite() : false);
        return response;
    }
    
    private Map<String, Object> createPhotoResponseWithDetails(Photo photo) {
        Map<String, Object> response = createPhotoResponseWithStats(photo);
        response.put("notes", photo.getNotes().stream()
                .map(note -> Map.of(
                        "id", note.getId(),
                        "content", note.getContent(),
                        "author", Map.of("name", note.getAuthor().getName()),
                        "createdAt", note.getCreatedAt()
                ))
                .collect(Collectors.toList()));
        return response;
    }

    /**
     * Update photo categories
     */
    @PutMapping("/{id}/categories")
    public ResponseEntity<?> updatePhotoCategories(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> categoryIdsRaw = (List<Object>) request.get("categoryIds");

            // Convert Integer/Long objects to Long
            List<Long> categoryIds = categoryIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList());

            Photo updatedPhoto = photoService.updatePhotoCategories(id, categoryIds);

            Map<String, Object> response = createPhotoResponseWithStats(updatedPhoto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating photo categories: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update photo categories");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Toggle photo favorite status
     */
    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Boolean favorite = (Boolean) request.get("favorite");

            // Get the photo and update favorite status
            Optional<Photo> photoOpt = photoService.getPhotoById(id);
            if (photoOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Photo not found");
                return ResponseEntity.notFound().build();
            }

            Photo photo = photoOpt.get();

            // Update favorite status
            photo.setIsFavorite(favorite);
            Photo updatedPhoto = photoService.savePhoto(photo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("favorite", updatedPhoto.getIsFavorite());
            response.put("photoId", id);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error toggling favorite: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to toggle favorite");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Test endpoint for debugging
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Photo controller is working!");
    }
    
    /**
     * Serve photo images with optional size parameter
     */
    @GetMapping("/image/{fileName:.+}")
    public ResponseEntity<Resource> getPhotoImage(
            @PathVariable String fileName,
            @RequestParam(value = "size", defaultValue = "full") String size) {
        try {
            Resource resource;
            
            // Generate thumbnail or medium size if requested
            if ("thumbnail".equals(size)) {
                resource = fileStorageService.getThumbnailImage(fileName, 300, 300);
            } else if ("medium".equals(size)) {
                resource = fileStorageService.getMediumImage(fileName, 800, 600);
            } else {
                // Load original file as Resource
                Path filePath = fileStorageService.getFilePath(fileName);
                resource = new UrlResource(filePath.toUri());
            }
            
            if (resource.exists() && resource.isReadable()) {
                // Try to determine file's content type
                String contentType = null;
                try {
                    if ("thumbnail".equals(size) || "medium".equals(size)) {
                        contentType = "image/jpeg"; // Thumbnails are always JPEG
                    } else {
                        Path filePath = fileStorageService.getFilePath(fileName);
                        contentType = java.nio.file.Files.probeContentType(filePath);
                    }
                } catch (IOException ex) {
                    logger.info("Could not determine file type for: {}", fileName);
                }
                
                // Fallback to the default content type if type could not be determined
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // Cache for 1 year
                        .body(resource);
            } else {
                logger.warn("Photo file not found or not readable: {}", fileName);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            logger.error("Error serving photo: {}", fileName, ex);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get user's favorite photos
     */
    @GetMapping("/favorites")
    public ResponseEntity<?> getFavoritePhotos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        try {
            if (page < 0) {
                // Legacy behavior: return all favorites for backward compatibility
                List<Photo> favoritePhotos = photoService.getFavoritePhotos();
                List<Map<String, Object>> favorites = favoritePhotos.stream()
                    .map(this::createPhotoResponseWithStats)
                    .collect(Collectors.toList());
                return ResponseEntity.ok(favorites);
            } else {
                // New paginated behavior
                Page<Photo> favoritePage = photoService.getFavoritePhotos(page, limit);
                List<Map<String, Object>> favorites = favoritePage.getContent().stream()
                    .map(this::createPhotoResponseWithStats)
                    .collect(Collectors.toList());
                
                Map<String, Object> response = new HashMap<>();
                response.put("photos", favorites);
                response.put("pagination", Map.of(
                    "currentPage", page,
                    "totalPages", favoritePage.getTotalPages(),
                    "total", favoritePage.getTotalElements(),
                    "hasNext", favoritePage.hasNext(),
                    "hasPrevious", favoritePage.hasPrevious()
                ));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            logger.error("Error getting favorite photos: ", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Bulk delete photos
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<?> bulkDeletePhotos(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> photoIdsRaw = (List<Object>) request.get("photoIds");
            
            if (photoIdsRaw == null || photoIdsRaw.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No photo IDs provided");
                return ResponseEntity.badRequest().body(error);
            }

            // Convert to Long list
            List<Long> photoIds = photoIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList());

            int deletedCount = photoService.bulkDeletePhotos(photoIds);

            Map<String, Object> response = new HashMap<>();
            response.put("message", deletedCount + " photo(s) deleted successfully");
            response.put("deletedCount", deletedCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error bulk deleting photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during bulk delete");
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Bulk update photo categories
     */
    @PutMapping("/bulk/categories")
    public ResponseEntity<?> bulkUpdatePhotoCategories(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> photoIdsRaw = (List<Object>) request.get("photoIds");
            @SuppressWarnings("unchecked")
            List<Object> categoryIdsRaw = (List<Object>) request.get("categoryIds");
            
            if (photoIdsRaw == null || photoIdsRaw.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No photo IDs provided");
                return ResponseEntity.badRequest().body(error);
            }

            // Convert to Long lists
            List<Long> photoIds = photoIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList());

            List<Long> categoryIds = categoryIdsRaw != null ? categoryIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList()) : new ArrayList<>();

            int updatedCount = photoService.bulkUpdatePhotoCategories(photoIds, categoryIds);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updatedCount + " photo(s) updated successfully");
            response.put("updatedCount", updatedCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error bulk updating photo categories", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during bulk update");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get deleted photos (recycle bin)
     */
    @GetMapping("/recycle-bin")
    public ResponseEntity<?> getDeletedPhotos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Photo> deletedPhotos = photoService.getDeletedPhotos(page, size);
            
            Map<String, Object> response = new HashMap<>();
            response.put("photos", deletedPhotos.getContent().stream()
                    .map(this::createPhotoResponseWithStats)
                    .collect(Collectors.toList()));
            response.put("currentPage", deletedPhotos.getNumber());
            response.put("totalPages", deletedPhotos.getTotalPages());
            response.put("totalElements", deletedPhotos.getTotalElements());
            response.put("hasNext", deletedPhotos.hasNext());
            response.put("hasPrevious", deletedPhotos.hasPrevious());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching deleted photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Recover photo from recycle bin
     */
    @PutMapping("/{id}/recover")
    public ResponseEntity<?> recoverPhoto(@PathVariable Long id) {
        try {
            boolean recovered = photoService.recoverPhoto(id);
            
            if (recovered) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Photo recovered successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Photo not found in recycle bin");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error recovering photo with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Permanently delete photo from recycle bin
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> permanentlyDeletePhoto(@PathVariable Long id) {
        try {
            boolean deleted = photoService.permanentlyDeletePhoto(id);
            
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Photo permanently deleted");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Photo not found in recycle bin");
                return ResponseEntity.status(404).body(error);
            }
            
        } catch (Exception e) {
            logger.error("Error permanently deleting photo with ID: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Bulk recover photos from recycle bin
     */
    @PutMapping("/bulk/recover")
    public ResponseEntity<?> bulkRecoverPhotos(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> photoIdsRaw = (List<Object>) request.get("photoIds");
            
            if (photoIdsRaw == null || photoIdsRaw.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No photo IDs provided");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Convert to Long list
            List<Long> photoIds = photoIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList());
            
            int recoveredCount = photoService.bulkRecoverPhotos(photoIds);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", recoveredCount + " photo(s) recovered successfully");
            response.put("recoveredCount", recoveredCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error bulk recovering photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during bulk recovery");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Bulk permanently delete photos from recycle bin
     */
    @DeleteMapping("/bulk/permanent")
    public ResponseEntity<?> bulkPermanentlyDeletePhotos(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> photoIdsRaw = (List<Object>) request.get("photoIds");
            
            if (photoIdsRaw == null || photoIdsRaw.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No photo IDs provided");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Convert to Long list
            List<Long> photoIds = photoIdsRaw.stream()
                .map(obj -> {
                    if (obj instanceof Integer) {
                        return ((Integer) obj).longValue();
                    } else if (obj instanceof Long) {
                        return (Long) obj;
                    } else {
                        return Long.valueOf(obj.toString());
                    }
                })
                .collect(Collectors.toList());
            
            int deletedCount = photoService.bulkPermanentlyDeletePhotos(photoIds);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", deletedCount + " photo(s) permanently deleted");
            response.put("deletedCount", deletedCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error bulk permanently deleting photos", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error during bulk deletion");
            return ResponseEntity.status(500).body(error);
        }
    }
}
