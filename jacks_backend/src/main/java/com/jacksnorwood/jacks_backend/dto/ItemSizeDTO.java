package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ItemSizeDTO {
    private Long id;
    private String name;
    private BigDecimal price;
}
