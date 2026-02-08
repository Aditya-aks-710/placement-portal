package com.nit.placement_portal.repository;

import com.nit.placement_portal.model.PlacementRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacementRequestRepository extends MongoRepository<PlacementRequest, String>{
    List<PlacementRequest> findByStatus(String status);

    List<PlacementRequest> findByCampusMode(String campusMode);

    List<PlacementRequest> findByPlacementNature(String placementNature);
}
