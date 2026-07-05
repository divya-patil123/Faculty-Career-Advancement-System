package com.faculty.app.controller;

import com.faculty.app.dto.AppDto;
import com.faculty.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    @Autowired private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AppDto.MessageResponse> register(@Valid @RequestBody AppDto.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AppDto.AuthResponse> login(@Valid @RequestBody AppDto.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
