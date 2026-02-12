package com.nit.placement_portal.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.nit.placement_portal.model.StudentPlacement;
import java.util.List;

@Repository
public interface StudentPlacementRepository extends MongoRepository<StudentPlacement, String> {
    List<StudentPlacement> findByStudentId(String studentId);
}
