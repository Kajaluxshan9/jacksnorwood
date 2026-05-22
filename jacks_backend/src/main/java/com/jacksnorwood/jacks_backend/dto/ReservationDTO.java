package com.jacksnorwood.jacks_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
public class ReservationDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private LocalDate date;
    private LocalTime time;
    private Integer guests;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
}
