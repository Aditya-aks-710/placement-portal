package com.nit.placement_portal.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.nit.placement_portal.dto.EducationDTO;
import com.nit.placement_portal.model.Education;
import com.nit.placement_portal.model.User;
import com.nit.placement_portal.service.EducationService;
import com.nit.placement_portal.repository.*;
import com.nit.placement_portal.exception.*;   

@RestController
@RequestMapping("/api/students")
public class EducationController {
    private final EducationService educationService;
    private final EducationRepository educationRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public EducationController(
            EducationService educationService,
            EducationRepository educationRepository,
            StudentRepository studentRepository,
            UserRepository userRepository
    ) {
        this.educationService = educationService;
        this.educationRepository = educationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{studentId}/education")
    public EducationDTO addEducation(
            @PathVariable String studentId,
            @RequestBody EducationDTO dto
    ) {
        ensureStudentExists(studentId);
        ensureOwnerOrAdmin(studentId);

        if(dto.getDegree() == null || dto.getDegree().isBlank()) {
            throw new BadRequestException("Degree is required");
        }
        if(dto.getInstitution() == null || dto.getInstitution().isBlank()) {
            throw new BadRequestException("Institution is required");
        }

        Education education = new Education();
        education.setStudentId(studentId);
        education.setDegree(dto.getDegree().trim());
        education.setInstitution(dto.getInstitution().trim());
        education.setYear(dto.getYear() == null ? null : dto.getYear().trim());
        education.setGrade(dto.getGrade() == null ? null : dto.getGrade().trim());

        return toDTO(educationService.saveEducation(education));
    }

    @DeleteMapping("/{studentId}/education/{educationId}")
    public void deleteEducation(
        @PathVariable String studentId,
        @PathVariable String educationId
     ) {
        ensureStudentExists(studentId);
        ensureOwnerOrAdmin(studentId);

        Education education = educationRepository.findById(educationId)
            .orElseThrow(() -> new ResourceNotFoundException("Education entry not found"));
        if(!studentId.equals(education.getStudentId())) {
            throw new ResourceNotFoundException("Education entry not found");
        }

        educationService.deleteEducation(educationId);
    }

    private EducationDTO toDTO(Education education) {
        EducationDTO dto = new EducationDTO();
        dto.setId(education.getId());
        dto.setDegree(education.getDegree());
        dto.setInstitution(education.getInstitution());
        dto.setYear(education.getYear());
        dto.setGrade(education.getGrade());
        return dto;
    }

    private void ensureStudentExists(String studentId) {
        if(studentRepository.findById(studentId).isEmpty()) {
            throw new ResourceNotFoundException("Student not found");
        }
    }

    private void ensureOwnerOrAdmin(String studentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if(auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }

        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if(isAdmin) {
            return;
        }

        User user = userRepository.findByUsername(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if(!studentId.equals(user.getStudentId())) {
            throw new UnauthorizedException("You can only edit your own profile");
        }
    }
}