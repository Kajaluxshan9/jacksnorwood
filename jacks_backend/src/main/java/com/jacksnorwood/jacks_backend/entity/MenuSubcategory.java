package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_subcategories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSubcategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String imageUrl;

    private Integer displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private MenuCategory category;
}
