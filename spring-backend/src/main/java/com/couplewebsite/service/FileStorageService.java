package com.couplewebsite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

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
     * Get file path
     */
    public Path getFilePath(String fileName) {
        return this.fileStorageLocation.resolve(fileName).normalize();
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
    
    /**
     * Generate thumbnail image with specified dimensions
     */
    public Resource getThumbnailImage(String fileName, int width, int height) throws IOException {
        return getResizedImage(fileName, width, height, "thumbnail");
    }
    
    /**
     * Generate medium-sized image with specified dimensions
     */
    public Resource getMediumImage(String fileName, int width, int height) throws IOException {
        return getResizedImage(fileName, width, height, "medium");
    }
    
    /**
     * Generate resized image and return as Resource
     */
    private Resource getResizedImage(String fileName, int width, int height, String sizeType) throws IOException {
        // Check if cached resized image exists
        String resizedFileName = getResizedFileName(fileName, sizeType, width, height);
        Path resizedPath = this.fileStorageLocation.resolve("cache").resolve(resizedFileName);
        
        // Create cache directory if it doesn't exist
        Files.createDirectories(resizedPath.getParent());
        
        // If cached version exists, return it
        if (Files.exists(resizedPath)) {
            return new UrlResource(resizedPath.toUri());
        }
        
        // Load original image
        Path originalPath = this.fileStorageLocation.resolve(fileName);
        if (!Files.exists(originalPath)) {
            throw new IOException("Original image not found: " + fileName);
        }
        
        BufferedImage originalImage = ImageIO.read(originalPath.toFile());
        if (originalImage == null) {
            throw new IOException("Could not read image: " + fileName);
        }
        
        // Calculate dimensions maintaining aspect ratio
        Dimension newDimension = calculateDimensions(originalImage.getWidth(), originalImage.getHeight(), width, height);
        
        // Create resized image
        BufferedImage resizedImage = new BufferedImage(newDimension.width, newDimension.height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        
        // Set rendering hints for better quality
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        g2d.drawImage(originalImage, 0, 0, newDimension.width, newDimension.height, null);
        g2d.dispose();
        
        // Save resized image to cache
        ImageIO.write(resizedImage, "jpg", resizedPath.toFile());
        
        return new UrlResource(resizedPath.toUri());
    }
    
    /**
     * Calculate new dimensions maintaining aspect ratio
     */
    private Dimension calculateDimensions(int originalWidth, int originalHeight, int maxWidth, int maxHeight) {
        double aspectRatio = (double) originalWidth / originalHeight;
        
        int newWidth = maxWidth;
        int newHeight = (int) (maxWidth / aspectRatio);
        
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = (int) (maxHeight * aspectRatio);
        }
        
        return new Dimension(newWidth, newHeight);
    }
    
    /**
     * Generate filename for resized image
     */
    private String getResizedFileName(String originalFileName, String sizeType, int width, int height) {
        String nameWithoutExtension = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
        return nameWithoutExtension + "_" + sizeType + "_" + width + "x" + height + ".jpg";
    }
}
