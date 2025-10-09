package com.couplewebsite.repository;

import com.couplewebsite.entity.UserSession;
import com.couplewebsite.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    Optional<UserSession> findBySessionId(String sessionId);
    
    List<UserSession> findByUserAndIsConnectedTrue(User user);
    
    @Modifying
    @Query("UPDATE UserSession us SET us.isConnected = false WHERE us.isConnected = true AND us.lastPingAt < :expiredTime")
    int markDisconnectedSessions(@Param("expiredTime") LocalDateTime expiredTime);
    
    @Query("SELECT us FROM UserSession us WHERE us.user.id = :userId AND us.isConnected = true")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM UserSession us WHERE us.isConnected = false AND us.lastPingAt < :cleanupTime")
    int deleteOldDisconnectedSessions(@Param("cleanupTime") LocalDateTime cleanupTime);
}