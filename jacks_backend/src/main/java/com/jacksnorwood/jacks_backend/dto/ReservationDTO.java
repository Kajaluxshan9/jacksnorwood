package com.jacksnorwood.jacks_backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
public class ReservationDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name is too long")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 180, message = "Email is too long")
    private String email;

    @Size(max = 40, message = "Phone number is too long")
    private String phone;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Time is required")
    private LocalTime time;

    @NotNull(message = "Number of guests is required")
    @Min(value = 1, message = "At least one guest is required")
    @Max(value = 100, message = "For parties this large please call us directly")
    private Integer guests;

    @Size(max = 1000, message = "Notes are too long")
    private String notes;

    private String status;
    private LocalDateTime createdAt;
}
