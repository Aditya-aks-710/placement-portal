package com.nit.placement_portal.controller;

import com.nit.placement_portal.dto.PlacementRequestDTO;
import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.repository.PlacementRequestRepository;
import com.nit.placement_portal.service.StudentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/placement-requests")
public class PlacementRequestController {

    private final PlacementRequestRepository placementRequestRepository;
    private final StudentService studentService;

    public PlacementRequestController(
            PlacementRequestRepository placementRequestRepository,
            StudentService studentService) {
        this.placementRequestRepository = placementRequestRepository;
        this.studentService = studentService;
    }

    @PostMapping
    public PlacementRequest submitRequest(@RequestBody PlacementRequestDTO dto) {

        PlacementRequest request = new PlacementRequest();
        request.setStudentId(dto.getStudentId());
        request.setCompany(dto.getCompany());
        request.setRole(dto.getRole());
        request.setCtc(dto.getCtc());
        request.setPlacementYear(dto.getPlacementYear());
        request.setCampusMode(dto.getCampusMode());
        request.setPlacementNature(dto.getPlacementNature());
        request.setStatus("PENDING");

        placementRequestRepository.save(request);

        studentService.markStudentPending(dto.getStudentId());

        return request;
    }
}