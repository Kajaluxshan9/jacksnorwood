package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "menu_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private String imageUrl;

    private Integer displayOrder;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MenuItem> items;
}
