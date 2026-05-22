package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String position;

    private String imageUrl;

    private Integer displayOrder;
}
