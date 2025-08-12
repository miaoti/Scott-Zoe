package com.couplewebsite.config;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(1)
public class StaticResourceFilter implements Filter {

    private static final Map<String, String> MIME_TYPES = new HashMap<>();
    
    static {
        MIME_TYPES.put(".css", "text/css");
        MIME_TYPES.put(".js", "application/javascript");
        MIME_TYPES.put(".json", "application/json");
        MIME_TYPES.put(".svg", "image/svg+xml");
        MIME_TYPES.put(".ico", "image/x-icon");
        MIME_TYPES.put(".png", "image/png");
        MIME_TYPES.put(".jpg", "image/jpeg");
        MIME_TYPES.put(".jpeg", "image/jpeg");
        MIME_TYPES.put(".woff", "font/woff");
        MIME_TYPES.put(".woff2", "font/woff2");
        MIME_TYPES.put(".ttf", "font/ttf");
        MIME_TYPES.put(".eot", "application/vnd.ms-fontobject");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        
        // Check if this is a static resource request
        if (requestURI.startsWith("/assets/") || isStaticResource(requestURI)) {
            String extension = getFileExtension(requestURI);
            String mimeType = MIME_TYPES.get(extension);
            
            if (mimeType != null) {
                httpResponse.setContentType(mimeType);
                // Add cache headers for static resources
                httpResponse.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
            }
        }
        
        chain.doFilter(request, response);
    }
    
    private boolean isStaticResource(String uri) {
        return uri.matches(".*\\.(css|js|svg|ico|png|jpg|jpeg|woff|woff2|ttf|eot)$");
    }
    
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }
        return "";
    }
}