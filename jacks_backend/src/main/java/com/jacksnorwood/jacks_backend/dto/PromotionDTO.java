package com.jacksnorwood.jacks_backend.dto;

import com.jacksnorwood.jacks_backend.entity.PromotionType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PromotionDTO {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Boolean active;
    private PromotionType promotionType;
    private String dayOfWeek;
}
