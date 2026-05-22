package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class MenuCategoryDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private List<MenuItemDTO> items;
}
