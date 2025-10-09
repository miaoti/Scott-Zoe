package com.couplewebsite.service;

import com.couplewebsite.entity.User;
import com.couplewebsite.entity.WindowPosition;
import com.couplewebsite.repository.UserRepository;
import com.couplewebsite.repository.WindowPositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class WindowPositionService {
    
    @Autowired
    private WindowPositionRepository windowPositionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public WindowPosition getOrCreateWindowPosition(Long userId) {
        Optional<WindowPosition> existingPosition = windowPositionRepository.findByUserId(userId);
        if (existingPosition.isPresent()) {
            return existingPosition.get();
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create default window position
        WindowPosition newPosition = new WindowPosition(user, 100, 100, 300, 400);
        return windowPositionRepository.save(newPosition);
    }
    
    public WindowPosition updateWindowPosition(Long userId, Integer x, Integer y, Integer width, Integer height) {
        WindowPosition position = getOrCreateWindowPosition(userId);
        
        if (x != null) position.setXPosition(x);
        if (y != null) position.setYPosition(y);
        if (width != null) position.setWidth(width);
        if (height != null) position.setHeight(height);
        
        return windowPositionRepository.save(position);
    }
    
    public void deleteWindowPosition(Long userId) {
        Optional<WindowPosition> position = windowPositionRepository.findByUserId(userId);
        position.ifPresent(windowPositionRepository::delete);
    }
}