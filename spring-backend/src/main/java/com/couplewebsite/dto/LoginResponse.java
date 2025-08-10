package com.couplewebsite.dto;

import com.couplewebsite.entity.User;

import java.time.LocalDate;

public class LoginResponse {

    private String token;
    private String type = "Bearer";
    private UserInfo user;

    // Constructors
    public LoginResponse() {}

    public LoginResponse(String token, User user) {
        this.token = token;
        this.user = new UserInfo(user);
    }

    // Inner class for user information
    public static class UserInfo {
        private Long id;
        private String username;
        private String name;
        private String relationshipStartDate;

        public UserInfo() {}

        public UserInfo(User user) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.name = user.getName();
            this.relationshipStartDate = user.getRelationshipStartDate() != null ?
                    user.getRelationshipStartDate().toString() : null;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRelationshipStartDate() { return relationshipStartDate; }
        public void setRelationshipStartDate(String relationshipStartDate) { this.relationshipStartDate = relationshipStartDate; }
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }
}
