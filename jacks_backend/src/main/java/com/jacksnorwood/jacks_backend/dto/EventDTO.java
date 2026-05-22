package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventDTO {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDate date;
    private LocalTime time;
    private String reservationLink;
    private Boolean active;
}
