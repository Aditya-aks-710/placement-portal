package com.nit.placement_portal.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.nit.placement_portal.model.StudentPlacement;
import com.nit.placement_portal.repository.StudentPlacementRepository;

@RestController
@RequestMapping("/api/student-placements")
public class StudentPlacementController {

    private final StudentPlacementRepository studentPlacementRepository;

    public StudentPlacementController(StudentPlacementRepository studentPlacementRepository) {
        this.studentPlacementRepository = studentPlacementRepository;
    }

    @GetMapping("/{studentId}")
    public List<StudentPlacement> getHistory(@PathVariable String studentId) {
        return studentPlacementRepository.findByStudentId(studentId);
    }
    
}
