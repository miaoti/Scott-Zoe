package com.couplewebsite.service;

import com.couplewebsite.entity.User;
import com.couplewebsite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User findByUsername(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user.get();
        }
        throw new RuntimeException("User not found: " + username);
    }

    public User findById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return user.get();
        }
        throw new RuntimeException("User not found with id: " + id);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public void updateTotalEarnings(Long userId, Integer totalEarnings) {
        User user = findById(userId);
        user.setTotalEarnings(totalEarnings);
        userRepository.save(user);
    }
}
