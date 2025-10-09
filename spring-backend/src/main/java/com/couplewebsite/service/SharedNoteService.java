package com.couplewebsite.service;

import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.NoteOperationRepository;
import com.couplewebsite.repository.SharedNoteRepository;
import com.couplewebsite.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SharedNoteService {
    
    private static final Logger logger = LoggerFactory.getLogger(SharedNoteService.class);
    
    @Autowired
    private SharedNoteRepository sharedNoteRepository;
    
    @Autowired
    private NoteOperationRepository noteOperationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public SharedNote getOrCreateSharedNote() {
        Optional<SharedNote> existingNote = sharedNoteRepository.findCurrentSharedNote();
        if (existingNote.isPresent()) {
            return existingNote.get();
        }
        
        // Create default shared note if none exists
        SharedNote newNote = new SharedNote();
        newNote.setContent("Welcome to your shared notes! Start typing here...");
        return sharedNoteRepository.save(newNote);
    }
    
    public SharedNote updateNoteContent(Long noteId, String content) {
        SharedNote note = sharedNoteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Shared note not found"));
        
        note.setContent(content);
        return sharedNoteRepository.save(note);
    }
    
    public NoteOperation saveOperation(Long noteId, Long userId, NoteOperation.OperationType operationType, 
                                     Integer position, String content, Integer length) {
        SharedNote note = sharedNoteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Shared note not found"));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Integer nextSequenceNumber = noteOperationRepository.findMaxSequenceNumberByNoteId(noteId) + 1;
        
        NoteOperation operation = new NoteOperation(note, user, operationType, position, content, length, nextSequenceNumber);
        return noteOperationRepository.save(operation);
    }
    
    public List<NoteOperation> getOperationsByNoteId(Long noteId) {
        return noteOperationRepository.findByNoteIdOrderBySequenceNumber(noteId);
    }
    
    public String applyOperations(String baseContent, List<NoteOperation> operations) {
        StringBuilder content = new StringBuilder(baseContent);
        
        // Track position adjustments for concurrent operations at the same position
        int[] positionAdjustments = new int[operations.size()];
        
        for (int i = 0; i < operations.size(); i++) {
            NoteOperation operation = operations.get(i);
            try {
                int originalPosition = operation.getPosition();
                String operationContent = operation.getContent();
                int contentLength = content.length();
                
                // Calculate adjusted position for INSERT operations
                int adjustedPosition = originalPosition;
                if (operation.getOperationType() == NoteOperation.OperationType.INSERT) {
                    // For INSERT operations, check if there are previous INSERT operations at the same position
                    for (int j = 0; j < i; j++) {
                        NoteOperation prevOp = operations.get(j);
                        if (prevOp.getOperationType() == NoteOperation.OperationType.INSERT && 
                            prevOp.getPosition().equals(originalPosition)) {
                            // Adjust position by the length of previous INSERT operations at the same position
                            adjustedPosition += prevOp.getContent() != null ? prevOp.getContent().length() : 0;
                        }
                    }
                }
                
                logger.debug("Applying operation: type={}, originalPosition={}, adjustedPosition={}, content='{}', currentContentLength={}", 
                    operation.getOperationType(), originalPosition, adjustedPosition, operationContent, contentLength);
                
                switch (operation.getOperationType()) {
                    case INSERT:
                        // Validate adjusted position is within valid bounds (0 to content.length())
                        if (adjustedPosition >= 0 && adjustedPosition <= contentLength) {
                            content.insert(adjustedPosition, operationContent != null ? operationContent : "");
                        } else {
                            logger.warn("Invalid INSERT position: {} (adjusted from {}) for content length: {}. Skipping operation.", 
                                adjustedPosition, originalPosition, contentLength);
                        }
                        break;
                    case DELETE:
                        // Validate position and length for DELETE operations
                        if (originalPosition >= 0 && originalPosition < contentLength && operation.getLength() > 0) {
                            int endPos = Math.min(originalPosition + operation.getLength(), contentLength);
                            content.delete(originalPosition, endPos);
                        } else {
                            logger.warn("Invalid DELETE operation: position={}, length={}, contentLength={}. Skipping operation.", 
                                originalPosition, operation.getLength(), contentLength);
                        }
                        break;
                    case RETAIN:
                        // RETAIN operations don't modify content, they're used for cursor positioning
                        logger.debug("RETAIN operation at position: {}", originalPosition);
                        break;
                    default:
                        logger.warn("Unknown operation type: {}", operation.getOperationType());
                        break;
                }
            } catch (Exception e) {
                logger.error("Error applying operation: type={}, position={}, content='{}'. Error: {}", 
                    operation.getOperationType(), operation.getPosition(), operation.getContent(), e.getMessage(), e);
                // Continue with next operation instead of failing completely
            }
        }
        
        return content.toString();
    }
    
    public SharedNote synchronizeContent(Long noteId) {
        SharedNote note = sharedNoteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Shared note not found"));
        
        List<NoteOperation> operations = getOperationsByNoteId(noteId);
        String synchronizedContent = applyOperations("", operations);
        
        note.setContent(synchronizedContent);
        return sharedNoteRepository.save(note);
    }
    
    public SharedNote getCurrentSharedNote() {
        return getOrCreateSharedNote();
    }
    
    public NoteOperation saveNoteOperation(SharedNote note, User user, NoteOperation.OperationType operationType, 
                                         Integer position, String content, Integer length) {
        logger.info("=== BACKEND saveNoteOperation DEBUG START ===");
        logger.info("Saving operation: type={}, position={}, content='{}', length={}, noteId={}, userId={}", 
            operationType, position, content, length, note.getId(), user.getId());
        
        Integer nextSequenceNumber = noteOperationRepository.findMaxSequenceNumberByNoteId(note.getId()) + 1;
        logger.info("Next sequence number: {}", nextSequenceNumber);
        
        NoteOperation operation = new NoteOperation(note, user, operationType, position, content, length, nextSequenceNumber);
        NoteOperation savedOperation = noteOperationRepository.save(operation);
        
        logger.info("Saved operation with ID: {}, sequenceNumber: {}", 
            savedOperation.getId(), savedOperation.getSequenceNumber());
        logger.info("=== BACKEND saveNoteOperation DEBUG END ===");
        
        return savedOperation;
    }
    
    public SharedNote applyOperation(SharedNote note, NoteOperation operation) {
        logger.info("=== BACKEND applyOperation DEBUG START ===");
        logger.info("Applying operation to note ID: {}, current content: '{}'", note.getId(), note.getContent());
        logger.info("Operation details: type={}, position={}, content='{}', length={}, sequenceNumber={}", 
            operation.getOperationType(), operation.getPosition(), operation.getContent(), 
            operation.getLength(), operation.getSequenceNumber());
        
        // Instead of applying to current content, reconstruct from all operations
        List<NoteOperation> allOperations = getOperationsByNoteId(note.getId());
        logger.info("Total operations for reconstruction: {}", allOperations.size());
        
        String synchronizedContent = applyOperations("", allOperations);
        logger.info("Reconstructed content: '{}' (length: {})", synchronizedContent, synchronizedContent.length());
        logger.info("Content change: '{}' -> '{}' (length change: {} -> {})", 
            note.getContent(), synchronizedContent, note.getContent().length(), synchronizedContent.length());
        
        note.setContent(synchronizedContent);
        SharedNote savedNote = sharedNoteRepository.save(note);
        
        logger.info("Saved note with updated content: '{}'", savedNote.getContent());
        logger.info("=== BACKEND applyOperation DEBUG END ===");
        
        return savedNote;
    }
}