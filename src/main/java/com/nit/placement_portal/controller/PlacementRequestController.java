package com.nit.placement_portal.controller;

import com.nit.placement_portal.dto.PlacementRequestDTO;
import com.nit.placement_portal.model.PlacementRequest;
import com.nit.placement_portal.repository.PlacementRequestRepository;
import com.nit.placement_portal.service.StudentService;
import com.nit.placement_portal.service.CompanyService;
import com.nit.placement_portal.model.Company;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/placement-requests")
public class PlacementRequestController {

    private final PlacementRequestRepository placementRequestRepository;
    private final StudentService studentService;
    private final CompanyService companyService;

    public PlacementRequestController(
            PlacementRequestRepository placementRequestRepository,
            StudentService studentService,
            CompanyService companyService) {
        this.placementRequestRepository = placementRequestRepository;
        this.studentService = studentService;
        this.companyService = companyService;
    }

    @PostMapping
    public PlacementRequest submitRequest(@RequestBody PlacementRequestDTO dto) {

        Company company = companyService.getCompanyById(dto.getCompanyId());

        PlacementRequest request = new PlacementRequest();
        request.setStudentId(dto.getStudentId());
        request.setCompanyId(company.getId());
        request.setCompany(company.getName());
        request.setCompanyLogo(company.getLogoUrl());
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