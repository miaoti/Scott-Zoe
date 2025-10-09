package com.couplewebsite.repository;

import com.couplewebsite.entity.SharedNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SharedNoteRepository extends JpaRepository<SharedNote, Long> {
    
    @Query("SELECT sn FROM SharedNote sn ORDER BY sn.updatedAt DESC LIMIT 1")
    Optional<SharedNote> findLatestSharedNote();
    
    @Query("SELECT sn FROM SharedNote sn WHERE sn.id = (SELECT MAX(sn2.id) FROM SharedNote sn2)")
    Optional<SharedNote> findCurrentSharedNote();
}