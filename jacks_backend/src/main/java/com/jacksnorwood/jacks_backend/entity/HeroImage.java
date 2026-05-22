package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hero_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    private Integer displayOrder;
    private Boolean active;
}
