package com.nit.placement_portal.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.nit.placement_portal.model.Company;

@Repository
public interface CompanyRepository extends MongoRepository<Company, String> {

    Optional<Company> findByNameIgnoreCase(String name);
}
