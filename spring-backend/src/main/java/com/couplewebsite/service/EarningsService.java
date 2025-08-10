package com.couplewebsite.service;

import com.couplewebsite.entity.Earnings;
import com.couplewebsite.entity.User;
import com.couplewebsite.repository.EarningsRepository;
import com.couplewebsite.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EarningsService {

    @Autowired
    private EarningsRepository earningsRepository;

    @Autowired
    private UserRepository userRepository;

    public Earnings addEarnings(User user, Integer amount, String source) {
        // Get current total earnings
        Integer currentTotal = user.getTotalEarnings();
        Integer newTotal = currentTotal + amount;
        
        // Update user's total earnings
        user.setTotalEarnings(newTotal);
        userRepository.save(user);
        
        // Create earnings record
        Earnings earnings = new Earnings(user, amount, newTotal, source);
        return earningsRepository.save(earnings);
    }

    public Integer getTotalEarnings(User user) {
        return user.getTotalEarnings();
    }

    public List<Earnings> getEarningsHistory(User user) {
        return earningsRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Earnings> getEarningsBySource(User user, String source) {
        return earningsRepository.findByUserAndSourceOrderByCreatedAtDesc(user, source);
    }
}
