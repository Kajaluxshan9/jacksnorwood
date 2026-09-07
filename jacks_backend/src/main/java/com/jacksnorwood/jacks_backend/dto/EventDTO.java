package com.jacksnorwood.jacks_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    // ── Partial-update presence tracking ──────────────────────────────────────
    // PUT is used for partial updates, so these fields need to distinguish
    // "not mentioned" (leave as-is) from "explicitly cleared" (set to null).
    // Previously they were applied unconditionally, so any payload that omitted
    // them wiped the stored values.

    @JsonIgnore private boolean imageUrlPresent;
    @JsonIgnore private boolean reservationLinkPresent;

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        this.imageUrlPresent = true;
    }

    public void setReservationLink(String reservationLink) {
        this.reservationLink = reservationLink;
        this.reservationLinkPresent = true;
    }
}
