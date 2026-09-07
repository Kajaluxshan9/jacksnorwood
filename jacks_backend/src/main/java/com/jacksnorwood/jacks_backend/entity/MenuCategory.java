package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
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

    // Read-only association: no cascade. Deleting a category removes its items
    // explicitly in MenuService.deleteCategory, so the behaviour does not depend
    // on whether this lazy collection happens to have been initialised.
    // Batched for the paths that do not fetch-join it (see findAllWithItems).
    @BatchSize(size = 100)
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<MenuItem> items;
}
