package com.couplewebsite.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

@Configuration
public class StaticResourceSecurityConfig {

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
            .requestMatchers("/assets/**")
            .requestMatchers("/static/**")
            .requestMatchers("/*.css")
            .requestMatchers("/*.js")
            .requestMatchers("/*.svg")
            .requestMatchers("/*.ico")
            .requestMatchers("/*.png")
            .requestMatchers("/*.jpg")
            .requestMatchers("/*.jpeg")
            .requestMatchers("/*.woff")
            .requestMatchers("/*.woff2")
            .requestMatchers("/*.ttf")
            .requestMatchers("/*.eot")
            .requestMatchers("/*.json")
            .requestMatchers("/*.txt")
            .requestMatchers("/*.map");
    }
}