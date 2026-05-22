package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String imageUrl;

    // startDateTime / endDateTime used only for SPECIAL type (date+time range filtering)
    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    @Builder.Default
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PromotionType promotionType = PromotionType.SPECIAL;

    // Only for DAILY type — e.g. "MONDAY", "TUESDAY", etc.
    private String dayOfWeek;
}
