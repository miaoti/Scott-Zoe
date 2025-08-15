package com.couplewebsite.controller;

import com.couplewebsite.service.LoveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/love-updates")
public class LoveUpdatesController {
    
    private static final Logger logger = LoggerFactory.getLogger(LoveUpdatesController.class);
    
    @Autowired
    private LoveService loveService;
    
    // Store SSE emitters for each user
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    
    /**
     * Subscribe to love count updates via Server-Sent Events
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Fetch initial data in a separate transaction
        Long partnerLoveCount = getPartnerLoveCount(currentUsername);
        String partnerUsername = "scott".equals(currentUsername) ? "zoe" : "scott";
        String partnerDisplayName = "scott".equals(partnerUsername) ? "Scott" : "Zoe";
        
        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout
        
        // Add emitter to user's list
        userEmitters.computeIfAbsent(currentUsername, k -> new CopyOnWriteArrayList<>()).add(emitter);
        
        // Remove emitter when connection is closed
        emitter.onCompletion(() -> removeEmitter(currentUsername, emitter));
        emitter.onTimeout(() -> removeEmitter(currentUsername, emitter));
        emitter.onError((ex) -> {
            logger.error("SSE error for user: " + currentUsername, ex);
            removeEmitter(currentUsername, emitter);
        });
        
        // Send initial data (no transaction context here)
        try {
            emitter.send(SseEmitter.event()
                .name("partner-love-update")
                .data(Map.of(
                    "partnerUsername", partnerUsername,
                    "partnerLoveCount", partnerLoveCount,
                    "partnerDisplayName", partnerDisplayName
                )));
        } catch (IOException e) {
            logger.error("Error sending initial SSE data", e);
            removeEmitter(currentUsername, emitter);
        }
        
        logger.info("SSE subscription created for user: {}", currentUsername);
        return emitter;
    }
    
    /**
     * Notify partner about love count update
     */
    @PostMapping("/notify-partner")
    public ResponseEntity<?> notifyPartner() {
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            String partnerUsername = "scott".equals(currentUsername) ? "zoe" : "scott";
            
            // Get current user's love count in a separate transaction
            Long currentUserLoveCount = loveService.getCurrentUserLoveCount();
            String currentDisplayName = "scott".equals(currentUsername) ? "Scott" : "Zoe";
            
            // Send update to partner's SSE connections
            CopyOnWriteArrayList<SseEmitter> partnerEmitters = userEmitters.get(partnerUsername);
            if (partnerEmitters != null) {
                for (SseEmitter emitter : partnerEmitters) {
                    try {
                        emitter.send(SseEmitter.event()
                            .name("partner-love-update")
                            .data(Map.of(
                                "partnerUsername", currentUsername,
                                "partnerLoveCount", currentUserLoveCount,
                                "partnerDisplayName", currentDisplayName
                            )));
                    } catch (IOException e) {
                        logger.error("Error sending SSE update to partner", e);
                        removeEmitter(partnerUsername, emitter);
                    }
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "Partner notified successfully"));
            
        } catch (Exception e) {
            logger.error("Error notifying partner", e);
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
    
    private void removeEmitter(String username, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(username);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(username);
            }
        }
        logger.info("SSE emitter removed for user: {}", username);
    }
    
    @Transactional(readOnly = true)
    private Long getPartnerLoveCount(String currentUsername) {
        String partnerUsername = "scott".equals(currentUsername) ? "zoe" : "scott";
        return loveService.getLoveCountByUsername(partnerUsername);
    }
}