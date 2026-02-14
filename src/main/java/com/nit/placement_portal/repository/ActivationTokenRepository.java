package com.nit.placement_portal.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nit.placement_portal.model.ActivationToken;

public interface ActivationTokenRepository extends MongoRepository<ActivationToken, String> {
    
    Optional<ActivationToken> findByToken(String token);
}