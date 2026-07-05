package com.faculty.app.service;

import com.faculty.app.dto.AppDto;
import com.faculty.app.entity.User;
import com.faculty.app.repository.UserRepository;
import com.faculty.app.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtUtils jwtUtils;

    public AppDto.MessageResponse register(AppDto.RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered.");
        if (req.getEmployeeId() != null && !req.getEmployeeId().isBlank()
                && userRepo.existsByEmployeeId(req.getEmployeeId()))
            throw new RuntimeException("Employee ID already in use.");

        User user = User.builder()
                .name(req.getName()).email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .employeeId(req.getEmployeeId()).department(req.getDepartment())
                .designation(req.getDesignation()).phone(req.getPhone())
                .role(User.Role.ROLE_FACULTY).active(true).build();
        userRepo.save(user);
        return new AppDto.MessageResponse("Registration successful! You can now log in.");
    }

    public AppDto.AuthResponse login(AppDto.LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        String token = jwtUtils.generateToken(auth);
        User user = userRepo.findByEmail(req.getEmail()).orElseThrow();
        return AppDto.AuthResponse.from(user, token);
    }

    public User getCurrentUser() {
        UserDetails ud = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepo.findByEmail(ud.getUsername()).orElseThrow();
    }
}
