package com.nit.placement_portal.service;

import com.nit.placement_portal.model.Student;
import com.nit.placement_portal.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {
    
    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student markStudentPending(String studentId) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student Not Found"));

        student.setStatus("Pending");
        return studentRepository.save(student);
    }
}
