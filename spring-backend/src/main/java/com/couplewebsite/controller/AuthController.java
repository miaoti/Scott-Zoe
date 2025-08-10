package com.couplewebsite.controller;

import com.couplewebsite.dto.LoginRequest;
import com.couplewebsite.dto.LoginResponse;
import com.couplewebsite.entity.User;
import com.couplewebsite.security.CustomUserDetailsService;
import com.couplewebsite.security.JwtUtil;
import com.couplewebsite.service.SettingsService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SettingsService settingsService;
    
    /**
     * User login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );
            
            // Get user details
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userDetailsService.getUserByUsername(userDetails.getUsername());
            
            // Generate JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            
            // Create response
            LoginResponse response = new LoginResponse(token, user);
            
            logger.info("User {} logged in successfully", user.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (BadCredentialsException e) {
            logger.warn("Failed login attempt for username: {}", loginRequest.getUsername());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid username or password");
            return ResponseEntity.status(401).body(error);
        } catch (Exception e) {
            logger.error("Login error for username: {}", loginRequest.getUsername(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Login failed");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get current user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            User user = userDetailsService.getUserByUsername(username);
            
            // Create response without sensitive data
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("name", user.getName());
            profile.put("relationshipStartDate", user.getRelationshipStartDate());
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            logger.error("Error getting user profile", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get user profile");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Validate JWT token
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                if (jwtUtil.validateToken(token)) {
                    String username = jwtUtil.extractUsername(token);
                    Long userId = jwtUtil.extractUserId(token);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("valid", true);
                    response.put("username", username);
                    response.put("userId", userId);
                    
                    return ResponseEntity.ok(response);
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            return ResponseEntity.status(401).body(response);
            
        } catch (Exception e) {
            logger.error("Token validation error", e);
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", "Token validation failed");
            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * Get relationship information
     */
    @GetMapping("/relationship-info")
    public ResponseEntity<?> getRelationshipInfo() {
        try {
            // Get relationship start date from settings
            LocalDate relationshipStartDate = settingsService.getRelationshipStartDate();

            // Calculate days together
            long daysTogether = ChronoUnit.DAYS.between(relationshipStartDate, LocalDate.now());

            // Get user names (assuming Scott and Zoe)
            List<String> names = Arrays.asList("Scott", "Zoe");

            Map<String, Object> response = new HashMap<>();
            response.put("startDate", relationshipStartDate.toString());
            response.put("daysTogether", daysTogether);
            response.put("names", names);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting relationship info", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Server error");
            return ResponseEntity.status(500).body(error);
        }
    }
}
