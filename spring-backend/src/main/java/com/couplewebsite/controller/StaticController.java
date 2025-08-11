package com.couplewebsite.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
public class StaticController {
    
    /**
     * Serve index.html for root path
     */
    @GetMapping("/")
    public ResponseEntity<Resource> index() throws IOException {
        ClassPathResource resource = new ClassPathResource("/static/index.html");
        
        if (resource.exists()) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        }
        
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Serve CSS files with correct MIME type
     */
    @GetMapping("/assets/{filename:.+\\.css}")
    public ResponseEntity<Resource> serveCss(@PathVariable String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource("/static/assets/" + filename);
        
        if (resource.exists()) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("text/css"));
            headers.setCacheControl("max-age=31536000"); // 1 year cache
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        }
        
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Serve JS files with correct MIME type
     */
    @GetMapping("/assets/{filename:.+\\.js}")
    public ResponseEntity<Resource> serveJs(@PathVariable String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource("/static/assets/" + filename);
        
        if (resource.exists()) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("application/javascript"));
            headers.setCacheControl("max-age=31536000"); // 1 year cache
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        }
        
        return ResponseEntity.notFound().build();
    }
}
