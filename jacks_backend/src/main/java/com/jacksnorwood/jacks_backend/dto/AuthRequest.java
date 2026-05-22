package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}
