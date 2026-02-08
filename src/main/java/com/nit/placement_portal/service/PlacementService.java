package com.nit.placement_portal.service;

import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.model.Student;
import com.nit.placement_portal.repository.PlacementRequestRepository;
import com.nit.placement_portal.repository.StudentRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlacementService {
    
    private final PlacementRequestRepository placementRequestRepository;
    private final StudentRepository studentRepository;

    public PlacementService(
        PlacementRequestRepository placementRequestRepository,
        StudentRepository studentRepository) {
        this.placementRequestRepository = placementRequestRepository;
        this.studentRepository = studentRepository;
    }

    public List<PlacementRequest> getRequestsByStatus(String status) {
        return placementRequestRepository.findByStatus(status);
    }

    public List<PlacementRequest> getRequestsByCampusMode(String campusMode) {
        return placementRequestRepository.findByCampusMode(campusMode);
    }

    public List<PlacementRequest> getRequestsByPlacementNature(String placementNature) {
        return placementRequestRepository.findByPlacementNature(placementNature);
    }

    public PlacementRequest approveRequest(String requestId) {

        PlacementRequest request = placementRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request Not Found"));

        if(!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be approved");
        }

        request.setStatus("APPROVED");
        placementRequestRepository.save(request);

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student Not Found"));

        student.setStatus("PLACED");
        student.setCompany(request.getCompany());

        studentRepository.save(student);
        return request;
    }

    public PlacementRequest rejectRequest(String requestId) {
        PlacementRequest request = placementRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request Not Found"));
        
        if(!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only Pending Requests can be Rejected");
        }

        request.setStatus("REJECTED");
        placementRequestRepository.save(request);

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student Not Found"));

        student.setStatus("UNPLACED");
        studentRepository.save(student);
        
        return request;
    }
}
