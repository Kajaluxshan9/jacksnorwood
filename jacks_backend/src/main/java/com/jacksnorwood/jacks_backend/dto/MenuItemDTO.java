package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuItemDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private String categoryName;
    private Long subcategoryId;
    private String subcategoryName;
    private String subcategoryImageUrl;
    private List<ItemSizeDTO> sizes;
    private Boolean isPopular;
    private Boolean isSpicy;
    private Boolean isVegan;
    private Boolean isActive;
}
