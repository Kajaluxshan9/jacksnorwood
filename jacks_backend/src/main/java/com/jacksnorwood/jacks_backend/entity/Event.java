package com.jacksnorwood.jacks_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String imageUrl;

    private LocalDate date;

    private LocalTime time;

    private String reservationLink;

    /**
     * Optional publication window: when the event is visible to the public.
     *
     * Separate from `date`, because when something is ON and when it should be
     * ADVERTISED are different things. A Thanksgiving menu with pre-orders
     * closing a week early needs to appear well before the event date, and a
     * pickup window running past it needs to stay up afterwards.
     *
     * Both ends are optional:
     *   displayFrom  null -> visible immediately
     *   displayUntil null -> falls back to the event date (hidden after the day
     *                        it happens), which is how events behaved before
     *                        this field existed.
     */
    private LocalDateTime displayFrom;

    private LocalDateTime displayUntil;

    @Builder.Default
    private Boolean active = true;
}
