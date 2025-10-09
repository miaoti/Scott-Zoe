package com.couplewebsite.controller;

import com.couplewebsite.dto.NoteOperationDto;
import com.couplewebsite.dto.SharedNoteDto;
import com.couplewebsite.dto.WindowPositionDto;
import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WindowPosition;
import com.couplewebsite.security.JwtUtil;
import com.couplewebsite.service.SharedNoteService;
import com.couplewebsite.service.UserService;
import com.couplewebsite.service.WindowPositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class SharedNoteController {
    
    @Autowired
    private SharedNoteService sharedNoteService;
    
    @Autowired
    private WindowPositionService windowPositionService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @GetMapping("/shared")
    public ResponseEntity<SharedNoteDto> getSharedNote() {
        try {
            SharedNote note = sharedNoteService.getOrCreateSharedNote();
            SharedNoteDto dto = convertToDto(note);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/update")
    public ResponseEntity<Map<String, Object>> updateNote(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not found"));
            }
            
            String operationType = (String) request.get("operation");
            Integer position = (Integer) request.get("position");
            String content = (String) request.get("content");
            Integer length = (Integer) request.get("length");
            
            SharedNote note = sharedNoteService.getOrCreateSharedNote();
            
            NoteOperation.OperationType opType = NoteOperation.OperationType.valueOf(operationType.toUpperCase());
            NoteOperation operation = sharedNoteService.saveOperation(note.getId(), user.getId(), opType, position, content, length);
            
            // Update the note content
            List<NoteOperation> operations = sharedNoteService.getOperationsByNoteId(note.getId());
            String updatedContent = sharedNoteService.applyOperations("", operations);
            sharedNoteService.updateNoteContent(note.getId(), updatedContent);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "operationId", operation.getId(),
                "sequenceNumber", operation.getSequenceNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/operations/{noteId}")
    public ResponseEntity<List<NoteOperationDto>> getOperations(@PathVariable Long noteId) {
        try {
            List<NoteOperation> operations = sharedNoteService.getOperationsByNoteId(noteId);
            List<NoteOperationDto> dtos = operations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/window-position")
    public ResponseEntity<WindowPositionDto> getWindowPosition(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            if (token == null) {
                return ResponseEntity.status(401).build();
            }
            
            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            
            WindowPosition position = windowPositionService.getOrCreateWindowPosition(user.getId());
            WindowPositionDto dto = convertToDto(position);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/window-position")
    public ResponseEntity<WindowPositionDto> updateWindowPosition(@RequestBody Map<String, Integer> request, HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).build();
            }
            
            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            
            Integer x = request.get("x");
            Integer y = request.get("y");
            Integer width = request.get("width");
            Integer height = request.get("height");
            
            WindowPosition position = windowPositionService.updateWindowPosition(user.getId(), x, y, width, height);
            WindowPositionDto dto = convertToDto(position);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
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
    
    private NoteOperationDto convertToDto(NoteOperation operation) {
        return new NoteOperationDto(
            operation.getId(),
            operation.getNote().getId(),
            operation.getUser().getId(),
            operation.getOperationType(),
            operation.getPosition(),
            operation.getContent(),
            operation.getLength(),
            operation.getCreatedAt(),
            operation.getSequenceNumber()
        );
    }
    
    private WindowPositionDto convertToDto(WindowPosition position) {
        return new WindowPositionDto(
            position.getId(),
            position.getUser().getId(),
            position.getXPosition(),
            position.getYPosition(),
            position.getWidth(),
            position.getHeight(),
            position.getUpdatedAt()
        );
    }
}