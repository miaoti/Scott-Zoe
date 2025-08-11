package com.couplewebsite.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MimeTypeConfig implements WebMvcConfigurer {

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer
            .favorParameter(false)
            .favorPathExtension(true)
            .ignoreAcceptHeader(false)
            .defaultContentType(org.springframework.http.MediaType.TEXT_HTML)
            .mediaType("css", org.springframework.http.MediaType.valueOf("text/css"))
            .mediaType("js", org.springframework.http.MediaType.valueOf("application/javascript"))
            .mediaType("json", org.springframework.http.MediaType.APPLICATION_JSON)
            .mediaType("html", org.springframework.http.MediaType.TEXT_HTML)
            .mediaType("png", org.springframework.http.MediaType.IMAGE_PNG)
            .mediaType("jpg", org.springframework.http.MediaType.IMAGE_JPEG)
            .mediaType("jpeg", org.springframework.http.MediaType.IMAGE_JPEG)
            .mediaType("gif", org.springframework.http.MediaType.IMAGE_GIF)
            .mediaType("svg", org.springframework.http.MediaType.valueOf("image/svg+xml"))
            .mediaType("ico", org.springframework.http.MediaType.valueOf("image/x-icon"))
            .mediaType("woff", org.springframework.http.MediaType.valueOf("font/woff"))
            .mediaType("woff2", org.springframework.http.MediaType.valueOf("font/woff2"))
            .mediaType("ttf", org.springframework.http.MediaType.valueOf("font/ttf"));
    }
}
