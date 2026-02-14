package com.nit.placement_portal.repository;

import com.nit.placement_portal.model.Student;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    List<Student> findByStatus(String status);

    Optional<Student> findByRegno(String regNo);
}
