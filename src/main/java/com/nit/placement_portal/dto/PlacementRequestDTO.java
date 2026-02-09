package com.nit.placement_portal.dto;

public class PlacementRequestDTO {

    private String studentId;
    private String companyId;
    private String role;
    private double ctc;
    private int placementYear;
    private String campusMode;
    private String placementNature;


    public String getStudentId() {
        return studentId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getRole() {
        return role;
    }

    public double getCtc() {
        return ctc;
    }

    public int getPlacementYear() {
        return placementYear;
    }

    public String getCampusMode() {
        return campusMode;
    }

    public String getPlacementNature() {
        return placementNature;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setCtc(double ctc) {
        this.ctc = ctc;
    }

    public void setPlacementYear(int placementYear) {
        this.placementYear = placementYear;
    }

    public void setCampusMode(String campusMode) {
        this.campusMode = campusMode;
    }

    public void setPlacementNature(String placementNature) {
        this.placementNature = placementNature;
    }
}
