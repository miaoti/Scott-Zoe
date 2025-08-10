package com.couplewebsite.controller;

import com.couplewebsite.entity.Photo;
import com.couplewebsite.service.PhotoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PhotoController {
    
    private static final Logger logger = LoggerFactory.getLogger(PhotoController.class);
    
    @Autowired
    private PhotoService photoService;
    
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
            @RequestParam("photos") List<MultipartFile> files,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy) {
        
        try {
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
            Page<Photo> photoPage = photoService.getAllPhotos(page, limit);
            
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
     * Get user's favorite photos
     */
    @GetMapping("/favorites")
    public ResponseEntity<List<Map<String, Object>>> getFavoritePhotos(Authentication authentication) {
        try {
            // Get all favorite photos
            List<Photo> favoritePhotos = photoService.getFavoritePhotos();
            List<Map<String, Object>> favorites = favoritePhotos.stream()
                .map(this::createPhotoResponseWithStats)
                .collect(Collectors.toList());
            return ResponseEntity.ok(favorites);
        } catch (Exception e) {
            logger.error("Error getting favorite photos: ", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
