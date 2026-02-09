package com.nit.placement_portal.dto;

public class CreateCompanyDTO {
    
    private String name;
    private String logoUrl;

    public String getName() {
        return name;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
}
