package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ContactMessageDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String cvUrl;
    private String message;
    private LocalDateTime createdAt;
    private Boolean isRead;
}
