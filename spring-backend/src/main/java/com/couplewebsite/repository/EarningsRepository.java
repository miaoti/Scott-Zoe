package com.couplewebsite.repository;

import com.couplewebsite.entity.Earnings;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EarningsRepository extends JpaRepository<Earnings, Long> {
    
    List<Earnings> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Earnings e WHERE e.user = :user")
    Integer getTotalEarningsByUser(@Param("user") User user);
    
    List<Earnings> findByUserAndSourceOrderByCreatedAtDesc(User user, String source);
}
