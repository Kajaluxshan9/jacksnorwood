package com.jacksnorwood.jacks_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ContactMessageDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name is too long")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 180, message = "Email is too long")
    private String email;

    @Size(max = 40, message = "Phone number is too long")
    private String phone;

    @Size(max = 120, message = "Subject is too long")
    private String subject;

    @Size(max = 255, message = "Attachment reference is too long")
    private String cvUrl;

    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message is too long (2000 characters max)")
    private String message;

    private LocalDateTime createdAt;
    private Boolean isRead;
}
