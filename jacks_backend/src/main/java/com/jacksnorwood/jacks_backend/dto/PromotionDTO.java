package com.jacksnorwood.jacks_backend.dto;

import com.jacksnorwood.jacks_backend.entity.PromotionType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PromotionDTO {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Boolean active;
    private PromotionType promotionType;
    private String dayOfWeek;

    // ── Partial-update presence tracking ──────────────────────────────────────
    // PUT is used for partial updates, so these fields need to distinguish
    // "not mentioned" (leave as-is) from "explicitly cleared" (set to null).
    // Previously they were applied unconditionally, so any payload that omitted
    // them wiped the stored values.

    @JsonIgnore private boolean dayOfWeekPresent;
    @JsonIgnore private boolean startDateTimePresent;
    @JsonIgnore private boolean endDateTimePresent;

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
        this.dayOfWeekPresent = true;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
        this.startDateTimePresent = true;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
        this.endDateTimePresent = true;
    }
}
