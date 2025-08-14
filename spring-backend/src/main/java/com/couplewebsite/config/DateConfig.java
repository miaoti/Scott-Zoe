package com.couplewebsite.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Configuration
public class DateConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        
        SimpleModule module = new SimpleModule();
        module.addDeserializer(LocalDate.class, new LocalDateDeserializer());
        mapper.registerModule(module);
        
        return mapper;
    }

    public static class LocalDateDeserializer extends JsonDeserializer<LocalDate> {
        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        @Override
        public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String dateString = p.getValueAsString();
            if (dateString == null || dateString.trim().isEmpty()) {
                return null;
            }
            
            // Parse the date string directly without timezone conversion
            return LocalDate.parse(dateString, FORMATTER);
        }
    }
}