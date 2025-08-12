package com.couplewebsite.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class MimeTypeConfig {

    @Bean
    public WebMvcConfigurer mimeTypeConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void configureContentNegotiation(org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer configurer) {
                // Set up proper MIME type mappings
                Map<String, MediaType> mediaTypes = new HashMap<>();
                mediaTypes.put("css", MediaType.valueOf("text/css"));
                mediaTypes.put("js", MediaType.valueOf("application/javascript"));
                mediaTypes.put("json", MediaType.APPLICATION_JSON);
                mediaTypes.put("svg", MediaType.valueOf("image/svg+xml"));
                mediaTypes.put("ico", MediaType.valueOf("image/x-icon"));
                mediaTypes.put("png", MediaType.IMAGE_PNG);
                mediaTypes.put("jpg", MediaType.IMAGE_JPEG);
                mediaTypes.put("jpeg", MediaType.IMAGE_JPEG);
                mediaTypes.put("woff", MediaType.valueOf("font/woff"));
                mediaTypes.put("woff2", MediaType.valueOf("font/woff2"));
                mediaTypes.put("ttf", MediaType.valueOf("font/ttf"));
                mediaTypes.put("eot", MediaType.valueOf("application/vnd.ms-fontobject"));
                
                configurer.mediaTypes(mediaTypes);
                configurer.favorPathExtension(true);
            }
        };
    }
}