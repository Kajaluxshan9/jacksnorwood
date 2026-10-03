package com.jacksnorwood.jacks_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    /** Publication window. Null ends are open; see Event for the fallback rules. */
    private LocalDateTime displayFrom;
    private LocalDateTime displayUntil;

    /** Read-only: whether this event is on the public site right now. */
    private Boolean visibleNow;

    private Boolean active;

    // ── Partial-update presence tracking ──────────────────────────────────────
    // PUT is used for partial updates, so these fields need to distinguish
    // "not mentioned" (leave as-is) from "explicitly cleared" (set to null).
    // Previously they were applied unconditionally, so any payload that omitted
    // them wiped the stored values.

    @JsonIgnore private boolean imageUrlPresent;
    @JsonIgnore private boolean reservationLinkPresent;
    @JsonIgnore private boolean displayFromPresent;
    @JsonIgnore private boolean displayUntilPresent;

    public void setDisplayFrom(LocalDateTime displayFrom) {
        this.displayFrom = displayFrom;
        this.displayFromPresent = true;
    }

    public void setDisplayUntil(LocalDateTime displayUntil) {
        this.displayUntil = displayUntil;
        this.displayUntilPresent = true;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        this.imageUrlPresent = true;
    }

    public void setReservationLink(String reservationLink) {
        this.reservationLink = reservationLink;
        this.reservationLinkPresent = true;
    }
}
