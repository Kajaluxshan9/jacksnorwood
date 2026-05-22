package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;

@Data
public class HeroImageDTO {
    private Long id;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean active;
}
