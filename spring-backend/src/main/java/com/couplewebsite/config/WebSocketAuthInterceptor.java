package com.couplewebsite.config;

import com.couplewebsite.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authToken = accessor.getFirstNativeHeader("Authorization");
            
            if (authToken != null && authToken.startsWith("Bearer ")) {
                try {
                    String token = authToken.substring(7);
                    
                    if (jwtUtil.validateToken(token)) {
                        String username = jwtUtil.extractUsername(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                        
                        accessor.setUser(authentication);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        logger.info("WebSocket authentication successful for user: {}", username);
                    } else {
                        logger.warn("Invalid JWT token in WebSocket connection");
                    }
                } catch (Exception e) {
                    logger.error("Error processing WebSocket authentication", e);
                }
            } else {
                logger.warn("No Authorization header found in WebSocket connection");
            }
        }
        
        return message;
    }
}