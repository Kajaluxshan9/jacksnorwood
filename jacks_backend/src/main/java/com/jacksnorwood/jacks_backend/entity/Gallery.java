package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gallery")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gallery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    private String category;

    private String caption;

    private Integer displayOrder;
}
