package com.couplewebsite.controller;

import com.couplewebsite.dto.NoteOperationDto;
import com.couplewebsite.dto.SharedNoteDto;
import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.security.JwtUtil;
import com.couplewebsite.service.SharedNoteService;
import com.couplewebsite.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/shared-note")
@CrossOrigin(origins = "*")
public class SharedNoteRestController {
    
    @Autowired
    private SharedNoteService sharedNoteService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @GetMapping("/current")
    public ResponseEntity<SharedNoteDto> getCurrentSharedNote(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return ResponseEntity.status(401).build();
            }
            
            String username = jwtUtil.extractUsername(token);
            if (username == null || userService.findByUsername(username) == null) {
                return ResponseEntity.status(401).build();
            }
            
            SharedNote note = sharedNoteService.getCurrentSharedNote();
            SharedNoteDto dto = convertToDto(note);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/operation")
    public ResponseEntity<Map<String, Object>> handleOperation(@RequestBody NoteOperationDto operationDto, HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            
            // Get current shared note
            SharedNote sharedNote = sharedNoteService.getCurrentSharedNote();
            
            // Save the operation
            NoteOperation operation = sharedNoteService.saveNoteOperation(
                sharedNote, user, operationDto.getOperationType(), 
                operationDto.getPosition(), operationDto.getContent(), 
                operationDto.getLength()
            );
            
            // Apply operation to note content
            SharedNote updatedNote = sharedNoteService.applyOperation(sharedNote, operation);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "operationId", operation.getId(),
                "updatedContent", updatedNote.getContent(),
                "sequenceNumber", operation.getSequenceNumber()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process operation: " + e.getMessage()));
        }
    }
    
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
    
    private SharedNoteDto convertToDto(SharedNote note) {
        return new SharedNoteDto(
            note.getId(),
            note.getContent(),
            note.getCreatedAt(),
            note.getUpdatedAt(),
            note.getCreatedBy() != null ? note.getCreatedBy().getId() : null
        );
    }
}