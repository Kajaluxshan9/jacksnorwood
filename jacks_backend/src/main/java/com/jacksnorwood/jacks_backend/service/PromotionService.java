package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.PromotionDTO;
import com.jacksnorwood.jacks_backend.entity.Promotion;
import com.jacksnorwood.jacks_backend.entity.PromotionType;
import com.jacksnorwood.jacks_backend.repository.PromotionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;



@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final NewsletterService newsletterService;
    private final FileStorageService fileStorage;

    private static final List<String> DAY_ORDER =
            List.of("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday");

    private Comparator<Promotion> byDateTime() {
        return Comparator
                // DAILY first, then SPECIAL
                .comparingInt((Promotion p) -> p.getPromotionType() == PromotionType.DAILY ? 0 : 1)
                // Within DAILY: by day-of-week order (Mon → Sun)
                .thenComparingInt(p -> {
                    if (p.getPromotionType() != PromotionType.DAILY) return 0;
                    int idx = p.getDayOfWeek() != null ? DAY_ORDER.indexOf(p.getDayOfWeek()) : -1;
                    return idx < 0 ? DAY_ORDER.size() : idx;
                })
                // Within SPECIAL: by startDateTime ascending (nulls last)
                .thenComparing(p ->
                        p.getStartDateTime() != null ? p.getStartDateTime() : LocalDateTime.MAX
                );
    }

    public List<PromotionDTO> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findByActiveTrue().stream()
                .filter(p -> {
                    if (p.getPromotionType() == PromotionType.DAILY) return true;
                    boolean afterStart = p.getStartDateTime() == null || !now.isBefore(p.getStartDateTime());
                    boolean beforeEnd  = p.getEndDateTime()   == null || !now.isAfter(p.getEndDateTime());
                    return afterStart && beforeEnd;
                })
                .sorted(byDateTime())
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<PromotionDTO> getAllPromotions() {
        return promotionRepository.findAll().stream()
                .sorted(byDateTime())
                .map(this::toDTO).collect(Collectors.toList());
    }

    public PromotionDTO create(PromotionDTO dto) {
        validate(dto);
        PromotionType type = dto.getPromotionType() != null ? dto.getPromotionType() : PromotionType.SPECIAL;
        Promotion p = Promotion.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .startDateTime(dto.getStartDateTime())
                .endDateTime(dto.getEndDateTime())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .promotionType(type)
                .dayOfWeek(dto.getDayOfWeek())
                .build();
        PromotionDTO saved = toDTO(promotionRepository.save(p));

        // Only announce promotions that are actually live. Announcing an inactive
        // one told subscribers about something they could not yet see.
        if (Boolean.TRUE.equals(saved.getActive())) {
            try {
                String typeLabel = type == PromotionType.DAILY ? "Daily Special" : "Special";
                String body = saved.getDescription() != null && !saved.getDescription().isBlank()
                        ? saved.getDescription() : "Visit us to find out more!";
                newsletterService.notifySubscribers("New " + typeLabel + ": " + saved.getTitle(), body, saved.getImageUrl());
            } catch (Exception e) {
                log.warn("Could not queue promotion announcement: {}", e.getMessage());
            }
        }
        return saved;
    }

    public PromotionDTO update(Long id, PromotionDTO dto) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Promotion", id));
        validate(dto);

        if (dto.getTitle() != null)         p.setTitle(dto.getTitle());
        if (dto.getDescription() != null)   p.setDescription(dto.getDescription());
        if (dto.getActive() != null)        p.setActive(dto.getActive());
        if (dto.getPromotionType() != null) p.setPromotionType(dto.getPromotionType());

        if (dto.getImageUrl() != null) {
            String next = dto.getImageUrl().isBlank() ? null : dto.getImageUrl();
            if (p.getImageUrl() != null && !p.getImageUrl().equals(next)) {
                fileStorage.deleteQuietly(p.getImageUrl());
            }
            p.setImageUrl(next);
        }

        // Apply these only when the caller actually sent the key, so a partial
        // update no longer clears the schedule of an existing promotion.
        if (dto.isDayOfWeekPresent())       p.setDayOfWeek(dto.getDayOfWeek());
        if (dto.isStartDateTimePresent())   p.setStartDateTime(dto.getStartDateTime());
        if (dto.isEndDateTimePresent())     p.setEndDateTime(dto.getEndDateTime());

        return toDTO(promotionRepository.save(p));
    }

    public void delete(Long id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Promotion", id));
        fileStorage.deleteQuietly(p.getImageUrl());
        promotionRepository.delete(p);
    }

    /** Rules the admin UI states but never enforced on the wire. */
    private void validate(PromotionDTO dto) {
        if (dto.getTitle() != null && dto.getTitle().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (dto.getPromotionType() == PromotionType.DAILY) {
            String day = dto.getDayOfWeek();
            if (day == null || day.isBlank()) {
                throw new BadRequestException("A day of the week is required for a daily special");
            }
            if (!DAY_ORDER.contains(day)) {
                throw new BadRequestException("Unknown day of week: " + day);
            }
        }
        if (dto.getStartDateTime() != null && dto.getEndDateTime() != null
                && dto.getEndDateTime().isBefore(dto.getStartDateTime())) {
            throw new BadRequestException("End date and time must be after the start");
        }
    }

    private PromotionDTO toDTO(Promotion p) {
        PromotionDTO dto = new PromotionDTO();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setImageUrl(p.getImageUrl());
        dto.setStartDateTime(p.getStartDateTime());
        dto.setEndDateTime(p.getEndDateTime());
        dto.setActive(p.getActive());
        dto.setPromotionType(p.getPromotionType());
        dto.setDayOfWeek(p.getDayOfWeek());
        return dto;
    }
}
