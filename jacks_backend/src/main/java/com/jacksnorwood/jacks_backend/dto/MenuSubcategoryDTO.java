package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;

@Data
public class MenuSubcategoryDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private Integer displayOrder;
    private Long categoryId;
    private String categoryName;
}
