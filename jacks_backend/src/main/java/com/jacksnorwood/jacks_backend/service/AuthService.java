package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.AuthRequest;
import com.jacksnorwood.jacks_backend.dto.AuthResponse;
import com.jacksnorwood.jacks_backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER")
                .replace("ROLE_", "");
        String token = jwtTokenProvider.generateToken(request.getUsername(), role);
        return new AuthResponse(token, request.getUsername(), role);
    }
}
