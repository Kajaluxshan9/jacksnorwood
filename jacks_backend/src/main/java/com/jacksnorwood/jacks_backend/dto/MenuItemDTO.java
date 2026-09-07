package com.jacksnorwood.jacks_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuItemDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
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

    /**
     * True when the request body actually carried a "subcategoryId" key.
     *
     * PUT is used for partial updates here, so the service needs to tell
     * "caller did not mention the subcategory" (leave it alone) apart from
     * "caller explicitly sent null" (detach it). Without this distinction any
     * partial update silently cleared the item's subcategory.
     */
    @JsonIgnore
    private boolean subcategoryIdPresent;

    public void setSubcategoryId(Long subcategoryId) {
        this.subcategoryId = subcategoryId;
        this.subcategoryIdPresent = true;
    }

    @JsonIgnore
    public boolean isSubcategoryCleared() {
        return subcategoryIdPresent && subcategoryId == null;
    }
}
