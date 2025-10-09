package com.couplewebsite.repository;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WindowPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WindowPositionRepository extends JpaRepository<WindowPosition, Long> {
    
    Optional<WindowPosition> findByUser(User user);
    
    Optional<WindowPosition> findByUserId(Long userId);
}