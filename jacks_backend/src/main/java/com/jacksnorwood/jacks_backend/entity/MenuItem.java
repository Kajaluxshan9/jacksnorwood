package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private MenuCategory category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subcategory_id")
    private MenuSubcategory subcategory;

    @Builder.Default
    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ItemSize> sizes = new ArrayList<>();

    @Builder.Default
    private Boolean isPopular = false;

    @Builder.Default
    private Boolean isSpicy = false;

    @Builder.Default
    private Boolean isVegan = false;

    @Builder.Default
    private Boolean isActive = true;
}
