package com.nit.placement_portal.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "activation_tokens")
public class ActivationToken {
    
    @Id
    private String id;

    private String regno;
    private String token;
    private LocalDateTime expiry;
    private boolean used;

    public String getId() {
        return id;
    }

    public String getRegno() {
        return regno;
    }

    public String getToken() {
        return token;
    }

    public LocalDateTime getExpiry() {
        return expiry;
    }

    public boolean getUsed() {
        return used;
    }

    public void setRegno(String regno) {
        this.regno = regno;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setExpiry(LocalDateTime expiry) {
        this.expiry = expiry;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}
