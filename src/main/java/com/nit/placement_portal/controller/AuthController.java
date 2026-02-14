package com.nit.placement_portal.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.nit.placement_portal.model.ActivationToken;
import com.nit.placement_portal.model.User;
import com.nit.placement_portal.dto.RegisterRequest;
import com.nit.placement_portal.repository.ActivationTokenRepository;
import com.nit.placement_portal.repository.StudentRepository;
import com.nit.placement_portal.repository.UserRepository;
import com.nit.placement_portal.security.JwtUtil;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ActivationTokenRepository tokenRepository;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository,
                        StudentRepository studentRepository,
                        ActivationTokenRepository tokenRepository,
                        BCryptPasswordEncoder encoder,
                        JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.tokenRepository = tokenRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

   @PostMapping("initiate-registration")
   public String initiateRegistration(@RequestBody Map<String, String> request) {

        String regno = request.get("regno");

        var studentOpt = studentRepository.findByRegno(regno);
        if(studentOpt.isEmpty()) {
            throw new RuntimeException("Student not found");
        }

        String tokenValue = UUID.randomUUID().toString();

        ActivationToken token = new ActivationToken();
        token.setRegno(regno);
        token.setToken(tokenValue);
        token.setExpiry(LocalDateTime.now().plusMinutes(15));
        token.setUsed(false);

        tokenRepository.save(token);

        System.out.println("Activation Link :");
        System.out.println("http://localhost:8080/api/auth/complete-registration?token=" + tokenValue);

        return "Activation link generated";
   }

   @PostMapping("/complete-registration")
   public String completeRegistration(@RequestBody Map<String, String> request) {

        String tokenValue = request.get("token");
        String password = request.get("password");

        ActivationToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid Token"));
        
        if(token.getUsed()) {
            throw new RuntimeException("Token already used");
        }

        var student = studentRepository.findByRegno(token.getRegno())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        var user = new User();
        user.setUsername(student.getRegNo());
        user.setPassword(encoder.encode(password));
        user.setRole("Student");
        user.setStudentId(student.getId());

        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        return "Registration completed Successfully";
      }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody RegisterRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if(!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return Map.of("token", token);
    }
    
}
