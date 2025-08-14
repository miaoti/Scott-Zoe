package com.couplewebsite.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String requestMethod = request.getMethod();
        
        // Debug logging
        logger.info("JWT Filter processing {} {}", requestMethod, requestPath);

        // Skip JWT processing for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equals(requestMethod)) {
            logger.info("OPTIONS request detected, skipping JWT processing");
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT processing for static files and public endpoints
        if (isPublicPath(requestPath)) {
            logger.info("Path {} is public, skipping JWT processing", requestPath);
            filterChain.doFilter(request, response);
            return;
        }
        
        logger.info("Path {} requires JWT authentication", requestPath);

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String username = jwtUtil.extractUsername(jwt);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Check if the request path is public and doesn't need JWT processing
     */
    private boolean isPublicPath(String path) {
        return path.equals("/") ||
               path.equals("/index.html") ||
               path.startsWith("/assets/") ||
               path.startsWith("/static/") ||
               path.startsWith("/uploads/") ||
               path.equals("/api/auth/login") ||
               path.equals("/api/auth/validate") ||
               path.startsWith("/api/photos/image/") ||
               path.equals("/api/photos/test") ||
               path.equals("/api/photos") ||
               path.equals("/api/categories") ||
               path.equals("/health") ||
               path.startsWith("/api/health") ||
               path.startsWith("/api/debug/") ||
               path.startsWith("/actuator/health") ||
               path.endsWith(".css") ||
               path.endsWith(".js") ||
               path.endsWith(".html") ||
               path.endsWith(".ico") ||
               path.endsWith(".png") ||
               path.endsWith(".jpg") ||
               path.endsWith(".jpeg") ||
               path.endsWith(".gif") ||
               path.endsWith(".svg") ||
               path.endsWith(".woff") ||
               path.endsWith(".woff2") ||
               path.endsWith(".ttf");
    }
    
    /**
     * Extract JWT token from Authorization header or query parameter
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        // First try Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // For SSE endpoints, try query parameter
        String requestPath = request.getRequestURI();
        if (requestPath.contains("/api/love-updates/subscribe")) {
            String tokenParam = request.getParameter("token");
            if (StringUtils.hasText(tokenParam)) {
                return tokenParam;
            }
        }
        
        return null;
    }
}
