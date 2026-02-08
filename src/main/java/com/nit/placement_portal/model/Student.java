package com.nit.placement_portal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "students")
public class Student {
    
    @Id
    private String id;

    private String regno;
    private String name;
    private String branch;
    
    private String status;
    private String company;
    private String companyLogo;
    private String profilePic;

    public Student(){
        this.status = "Unplaced";
    }

    public String getId() {
        return id;
    }

    public String getRegNo() {
        return regno;
    }

    public String getName() {
        return name;
    }

    public String getBranch() {
        return branch;
    }

    public String getStatus() {
        return status;
    }

    public String getCompany() {
        return company;
    }

    public String getCompanyLogo() {
        return companyLogo;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setRegno(String regno) {
        this.regno = regno;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public void setCompanyLogo(String companyLogo) {
        this.companyLogo = companyLogo;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }
}
