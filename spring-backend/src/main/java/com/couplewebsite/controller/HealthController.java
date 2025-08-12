package com.couplewebsite.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController

public class HealthController {

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Server is running");
        return ResponseEntity.ok(response);
    }

    /**
     * Debug endpoint to check static files
     */
    @GetMapping("/api/debug/static")
    public ResponseEntity<?> debugStatic() {
        Map<String, Object> response = new HashMap<>();

        try {
            ClassPathResource indexResource = new ClassPathResource("/static/index.html");
            response.put("indexExists", indexResource.exists());

            ClassPathResource assetsResource = new ClassPathResource("/static/assets");
            response.put("assetsExists", assetsResource.exists());

            // List static directory contents
            try {
                ClassPathResource staticResource = new ClassPathResource("/static");
                if (staticResource.exists()) {
                    response.put("staticDirExists", true);
                } else {
                    response.put("staticDirExists", false);
                }
            } catch (Exception e) {
                response.put("staticDirError", e.getMessage());
            }

        } catch (Exception e) {
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
