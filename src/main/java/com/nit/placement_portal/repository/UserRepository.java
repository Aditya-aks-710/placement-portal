package com.nit.placement_portal.repository;

import com.nit.placement_portal.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;


public interface UserRepository extends MongoRepository<User, String> {
    
    Optional<User> findByUsername(String username);
}
