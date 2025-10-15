package com.couplewebsite.service;

import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileStorageService {
    
    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    
    private final Path fileStorageLocation;
    
    public FileStorageService(@Value("${file.upload.dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            logger.info("Upload directory created at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            logger.error("Could not create the directory where the uploaded files will be stored.", ex);
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }
    
    /**
     * Store file and return the generated filename
     */
    public String storeFile(MultipartFile file) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }
            
            // Generate unique filename
            String fileExtension = getFileExtension(originalFileName);
            String uniqueFileName = generateUniqueFileName() + fileExtension;
            
            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            logger.info("File stored successfully: {}", uniqueFileName);
            return uniqueFileName;
            
        } catch (IOException ex) {
            logger.error("Could not store file {}. Please try again!", originalFileName, ex);
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }
    
    /**
     * Store file with multiple sizes (original, medium, thumbnail) and return the generated filename
     */
    public String storeFileWithSizes(MultipartFile file) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }
            
            // Generate unique filename
            String fileExtension = getFileExtension(originalFileName);
            String baseFileName = generateUniqueFileName();
            String uniqueFileName = baseFileName + fileExtension;
            
            // Store original file
            Path originalLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), originalLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Generate and store different sizes
            generateImageSizes(originalLocation, baseFileName, fileExtension);
            
            logger.info("File with multiple sizes stored successfully: {}", uniqueFileName);
            return uniqueFileName;
            
        } catch (IOException ex) {
            logger.error("Could not store file {}. Please try again!", originalFileName, ex);
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }
    
    /**
     * Generate different image sizes (thumbnail, medium) from the original image
     */
    private void generateImageSizes(Path originalPath, String baseFileName, String fileExtension) {
        try {
            // Generate thumbnail (300x300)
            String thumbnailFileName = baseFileName + "_thumbnail" + fileExtension;
            Path thumbnailPath = this.fileStorageLocation.resolve(thumbnailFileName);
            Thumbnails.of(originalPath.toFile())
                    .size(300, 300)
                    .outputQuality(0.8)
                    .toFile(thumbnailPath.toFile());
            
            // Generate medium size (800x600)
            String mediumFileName = baseFileName + "_medium" + fileExtension;
            Path mediumPath = this.fileStorageLocation.resolve(mediumFileName);
            Thumbnails.of(originalPath.toFile())
                    .size(800, 600)
                    .outputQuality(0.85)
                    .toFile(mediumPath.toFile());
            
            logger.info("Generated thumbnail and medium sizes for: {}", baseFileName);
            
        } catch (IOException ex) {
            logger.error("Could not generate image sizes for: {}", baseFileName, ex);
            // Don't throw exception here, as the original file is already stored
        }
    }
    
    /**
     * Delete file by filename
     */
    public boolean deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
            logger.info("File deleted successfully: {}", fileName);
            return true;
        } catch (IOException ex) {
            logger.error("Could not delete file: {}", fileName, ex);
            return false;
        }
    }
    
    /**
     * Get file path by filename
     */
    public Path getFilePath(String fileName) {
        return this.fileStorageLocation.resolve(fileName).normalize();
    }
    
    /**
     * Get file path for specific size (thumbnail, medium, or original)
     */
    public Path getFilePathWithSize(String fileName, String size) {
        if ("thumbnail".equals(size) || "medium".equals(size)) {
            String baseFileName = getBaseFileName(fileName);
            String fileExtension = getFileExtension(fileName);
            String sizedFileName = baseFileName + "_" + size + fileExtension;
            Path sizedPath = this.fileStorageLocation.resolve(sizedFileName).normalize();
            
            // If sized version doesn't exist, return original
            if (!Files.exists(sizedPath)) {
                return this.fileStorageLocation.resolve(fileName).normalize();
            }
            return sizedPath;
        }
        // For "large" or any other size, return original
        return this.fileStorageLocation.resolve(fileName).normalize();
    }
    
    /**
     * Get base filename without extension
     */
    private String getBaseFileName(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return fileName.substring(0, lastDotIndex);
        }
        return fileName;
    }
    
    /**
     * Check if file exists
     */
    public boolean fileExists(String fileName) {
        Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
        return Files.exists(filePath);
    }
    
    /**
     * Get file extension from filename
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        
        return fileName.substring(lastDotIndex);
    }
    
    /**
     * Generate unique filename using UUID and timestamp
     */
    private String generateUniqueFileName() {
        return "photo-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    /**
     * Validate file type
     */
    public boolean isValidImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && contentType.startsWith("image/");
    }
    
    /**
     * Get upload directory path
     */
    public Path getUploadDirectory() {
        return this.fileStorageLocation;
    }
}
