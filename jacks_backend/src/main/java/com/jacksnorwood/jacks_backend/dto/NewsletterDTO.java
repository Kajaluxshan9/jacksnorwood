package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NewsletterDTO {
    private Long id;
    private String email;
    private String name;
    private LocalDateTime subscribedAt;

    // Used for send-newsletter request
    private String subject;
    private String body;
    private String imageUrl;
}
