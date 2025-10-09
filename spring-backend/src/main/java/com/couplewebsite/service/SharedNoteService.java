package com.couplewebsite.service;

import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.NoteOperationRepository;
import com.couplewebsite.repository.SharedNoteRepository;
import com.couplewebsite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SharedNoteService {
    
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
            switch (operation.getOperationType()) {
                case INSERT:
                    if (operation.getPosition() <= content.length()) {
                        content.insert(operation.getPosition(), operation.getContent());
                    }
                    break;
                case DELETE:
                    if (operation.getPosition() < content.length()) {
                        int endPos = Math.min(operation.getPosition() + operation.getLength(), content.length());
                        content.delete(operation.getPosition(), endPos);
                    }
                    break;
                case RETAIN:
                    // RETAIN operations don't modify content, they're used for cursor positioning
                    break;
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