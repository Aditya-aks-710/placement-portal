package com.nit.placement_portal.service;

import org.springframework.stereotype.Service;
import com.nit.placement_portal.model.Company;
import com.nit.placement_portal.repository.CompanyRepository;

import java.util.List;

@Service
public class CompanyService {
    
    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company createCompany(String name, String logoUrl) {
        return companyRepository.findByNameIgnoreCase(name)
            .orElseGet(() -> {
                Company company = new Company();
                company.setName(name);
                company.setLogoUrl(logoUrl);
                return companyRepository.save(company);
            });
    }

    public Company getCompanyById(String id) {
        return companyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Company Not Found"));
    }
}
