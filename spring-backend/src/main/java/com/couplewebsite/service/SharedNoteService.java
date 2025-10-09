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
        
        for (NoteOperation operation : operations) {
            try {
                int position = operation.getPosition();
                String operationContent = operation.getContent();
                int contentLength = content.length();
                
                logger.debug("Applying operation: type={}, position={}, content='{}', currentContentLength={}", 
                    operation.getOperationType(), position, operationContent, contentLength);
                
                switch (operation.getOperationType()) {
                    case INSERT:
                        // Validate position is within valid bounds (0 to content.length())
                        if (position >= 0 && position <= contentLength) {
                            content.insert(position, operationContent != null ? operationContent : "");
                        } else {
                            logger.warn("Invalid INSERT position: {} for content length: {}. Skipping operation.", 
                                position, contentLength);
                        }
                        break;
                    case DELETE:
                        // Validate position and length for DELETE operations
                        if (position >= 0 && position < contentLength && operation.getLength() > 0) {
                            int endPos = Math.min(position + operation.getLength(), contentLength);
                            content.delete(position, endPos);
                        } else {
                            logger.warn("Invalid DELETE operation: position={}, length={}, contentLength={}. Skipping operation.", 
                                position, operation.getLength(), contentLength);
                        }
                        break;
                    case RETAIN:
                        // RETAIN operations don't modify content, they're used for cursor positioning
                        logger.debug("RETAIN operation at position: {}", position);
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
        Integer nextSequenceNumber = noteOperationRepository.findMaxSequenceNumberByNoteId(note.getId()) + 1;
        
        NoteOperation operation = new NoteOperation(note, user, operationType, position, content, length, nextSequenceNumber);
        return noteOperationRepository.save(operation);
    }
    
    public SharedNote applyOperation(SharedNote note, NoteOperation operation) {
        String currentContent = note.getContent();
        String newContent = applyOperations(currentContent, List.of(operation));
        note.setContent(newContent);
        return sharedNoteRepository.save(note);
    }
}