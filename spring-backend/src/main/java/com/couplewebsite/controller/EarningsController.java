package com.couplewebsite.controller;

import com.couplewebsite.entity.Earnings;
import com.couplewebsite.entity.User;
import com.couplewebsite.service.EarningsService;
import com.couplewebsite.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/earnings")

public class EarningsController {

    @Autowired
    private EarningsService earningsService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTotalEarnings(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            Integer totalEarnings = earningsService.getTotalEarnings(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("total", totalEarnings);
            response.put("username", user.getName());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch earnings");
            errorResponse.put("total", 0);
            return ResponseEntity.ok(errorResponse);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addEarnings(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            Integer amount = (Integer) request.get("amount");
            String source = (String) request.get("source");
            
            if (amount == null || amount <= 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid amount");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Earnings earnings = earningsService.addEarnings(user, amount, source != null ? source : "unknown");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("amount", amount);
            response.put("total", earnings.getTotalAfter());
            response.put("source", earnings.getSource());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to add earnings");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Earnings>> getEarningsHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            List<Earnings> history = earningsService.getEarningsHistory(user);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testEarnings(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            // Add test earnings
            Earnings earnings = earningsService.addEarnings(user, 50, "test");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Test earnings added successfully");
            response.put("amount", 50);
            response.put("total", earnings.getTotalAfter());
            response.put("userTotalEarnings", user.getTotalEarnings());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Test failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
