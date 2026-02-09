package com.nit.placement_portal.controller;

import org.springframework.web.bind.annotation.*;

import com.nit.placement_portal.dto.CreateCompanyDTO;
import com.nit.placement_portal.model.Company;
import com.nit.placement_portal.service.CompanyService;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {
    
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyService.getAllCompanies();
    }

    @PostMapping
    public Company addCompany(@RequestBody CreateCompanyDTO dto) {
        return companyService.createCompany(dto.getName(), dto.getLogoUrl());
    }
}
