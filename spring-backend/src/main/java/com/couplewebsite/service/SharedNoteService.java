package com.couplewebsite.service;

import com.couplewebsite.entity.SharedNote;
import com.couplewebsite.repository.SharedNoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class SharedNoteService {
    
    private static final Logger logger = LoggerFactory.getLogger(SharedNoteService.class);
    
    @Autowired
    private SharedNoteRepository sharedNoteRepository;
    
    /**
     * Find shared note by ID
     */
    public SharedNote findById(Long noteId) {
        Optional<SharedNote> noteOpt = sharedNoteRepository.findById(noteId);
        return noteOpt.orElse(null);
    }
    
    /**
     * Update note content
     */
    public SharedNote updateNoteContent(Long noteId, String content) {
        Optional<SharedNote> noteOpt = sharedNoteRepository.findById(noteId);
        if (noteOpt.isPresent()) {
            SharedNote note = noteOpt.get();
            note.setContent(content);
            return sharedNoteRepository.save(note);
        }
        throw new RuntimeException("Shared note not found with ID: " + noteId);
    }
    
    /**
     * Get or create the current shared note
     */
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
    
    /**
     * Create a new shared note
     */
    public SharedNote createSharedNote(String content) {
        SharedNote note = new SharedNote();
        note.setContent(content);
        return sharedNoteRepository.save(note);
    }
    
    /**
     * Get the latest shared note
     */
    public SharedNote getLatestSharedNote() {
        Optional<SharedNote> noteOpt = sharedNoteRepository.findLatestSharedNote();
        return noteOpt.orElse(null);
    }
}