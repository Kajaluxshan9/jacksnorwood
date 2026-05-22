package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.AuthRequest;
import com.jacksnorwood.jacks_backend.dto.AuthResponse;
import com.jacksnorwood.jacks_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
