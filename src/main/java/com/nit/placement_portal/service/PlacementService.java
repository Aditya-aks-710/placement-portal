package com.nit.placement_portal.service;

import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.model.Student;
import com.nit.placement_portal.model.StudentPlacement;
import com.nit.placement_portal.repository.PlacementRequestRepository;
import com.nit.placement_portal.repository.StudentPlacementRepository;
import com.nit.placement_portal.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PlacementService {
    
    private final PlacementRequestRepository placementRequestRepository;
    private final StudentRepository studentRepository;
    private final StudentPlacementRepository studentPlacementRepository;

    public PlacementService(
        PlacementRequestRepository placementRequestRepository,
        StudentRepository studentRepository,
        StudentPlacementRepository studentPlacementRepository) {
        this.placementRequestRepository = placementRequestRepository;
        this.studentRepository = studentRepository;
        this.studentPlacementRepository = studentPlacementRepository;
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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending requests can be approved"
                );
        }

        request.setStatus("APPROVED");
        placementRequestRepository.save(request);

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student Not Found"));

        student.setStatus("PLACED");
        student.setCompany(request.getCompany());
        student.setCompanyLogo(request.getCompanyLogo());

        studentRepository.save(student);

        StudentPlacement history = new StudentPlacement();
        history.setStudentId(request.getStudentId());
        history.setCompanyId(request.getCompanyId());
        history.setCompany(request.getCompany());
        history.setCompanyLogo(request.getCompanyLogo());
        history.setRole(request.getRole());
        history.setCtc(request.getCtc());
        history.setPlacementYear(request.getPlacementYear());
        history.setCampusMode(request.getCampusMode());
        history.setPlacementNature(request.getPlacementNature());
        
        studentPlacementRepository.save(history);
        
        return request;
    }

    public PlacementRequest rejectRequest(String requestId) {
        PlacementRequest request = placementRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request Not Found"));
        
        if(!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only Pending Requests can be Rejected"
            );
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
