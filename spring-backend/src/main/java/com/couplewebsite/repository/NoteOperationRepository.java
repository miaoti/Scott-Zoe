package com.couplewebsite.repository;

import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.SharedNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteOperationRepository extends JpaRepository<NoteOperation, Long> {
    
    List<NoteOperation> findByNoteOrderBySequenceNumberAsc(SharedNote note);
    
    @Query("SELECT no FROM NoteOperation no WHERE no.note.id = :noteId ORDER BY no.sequenceNumber ASC")
    List<NoteOperation> findByNoteIdOrderBySequenceNumber(@Param("noteId") Long noteId);
    
    @Query("SELECT COALESCE(MAX(no.sequenceNumber), 0) FROM NoteOperation no WHERE no.note.id = :noteId")
    Integer findMaxSequenceNumberByNoteId(@Param("noteId") Long noteId);
}