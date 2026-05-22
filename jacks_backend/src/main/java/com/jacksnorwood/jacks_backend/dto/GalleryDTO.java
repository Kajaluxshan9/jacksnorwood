package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;

@Data
public class GalleryDTO {
    private Long id;
    private String imageUrl;
    private String category;
    private String caption;
    private Integer displayOrder;
}
