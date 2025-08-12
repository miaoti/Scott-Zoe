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
     * Catch-all for React routing - serve index.html for any non-API route
     */
    @GetMapping(value = {"/login", "/gallery", "/memories", "/wheel", "/settings", "/category/**", "/photos", "/photo/**", "/{path:^(?!api|uploads|health|assets).*}"})
    public ResponseEntity<Resource> reactRouting() throws IOException {
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
}
