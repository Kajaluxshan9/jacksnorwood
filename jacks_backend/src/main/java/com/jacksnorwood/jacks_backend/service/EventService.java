package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.entity.Event;
import com.jacksnorwood.jacks_backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final NewsletterService newsletterService;
    private final FileStorageService fileStorage;

    /**
     * Events the public "Upcoming Events" page should show: active, and not in
     * the past. Undated events are treated as always-upcoming and listed last,
     * since there is nothing to compare them against.
     */
    public List<EventDTO> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        List<Event> upcoming = new ArrayList<>(
                eventRepository.findByActiveTrueAndDateGreaterThanEqualOrderByDateAscTimeAsc(today));
        upcoming.addAll(eventRepository.findByActiveTrueAndDateIsNullOrderByIdAsc());
        return upcoming.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllByOrderByDateAscIdAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EventDTO create(EventDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new BadRequestException("Event title is required");
        }
        Event e = Event.builder()
                .title(dto.getTitle()).description(dto.getDescription())
                .imageUrl(dto.getImageUrl()).date(dto.getDate()).time(dto.getTime())
                .reservationLink(dto.getReservationLink())
                .active(dto.getActive() != null ? dto.getActive() : true).build();
        EventDTO saved = toDTO(eventRepository.save(e));

        // Only announce events that are actually published.
        if (Boolean.TRUE.equals(saved.getActive())) {
            try {
                String body = (saved.getDescription() != null && !saved.getDescription().isBlank())
                        ? saved.getDescription() : "Visit us for this exciting event!";
                newsletterService.notifySubscribers("New Event: " + saved.getTitle(), body, saved.getImageUrl());
            } catch (Exception e2) {
                log.warn("Could not queue event announcement: {}", e2.getMessage());
            }
        }
        return saved;
    }

    public EventDTO update(Long id, EventDTO dto) {
        Event e = eventRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Event", id));
        if (dto.getTitle() != null)       e.setTitle(dto.getTitle());
        if (dto.getDescription() != null) e.setDescription(dto.getDescription());
        if (dto.getDate() != null)        e.setDate(dto.getDate());
        if (dto.getTime() != null)        e.setTime(dto.getTime());
        if (dto.getActive() != null)      e.setActive(dto.getActive());

        // Applied only when the caller sent the key, so these stay clearable
        // (send "" or null) without a partial update wiping them by accident.
        if (dto.isImageUrlPresent()) {
            String next = (dto.getImageUrl() == null || dto.getImageUrl().isBlank()) ? null : dto.getImageUrl();
            if (e.getImageUrl() != null && !e.getImageUrl().equals(next)) {
                fileStorage.deleteQuietly(e.getImageUrl());
            }
            e.setImageUrl(next);
        }
        if (dto.isReservationLinkPresent()) {
            String link = dto.getReservationLink();
            e.setReservationLink(link == null || link.isBlank() ? null : link);
        }
        return toDTO(eventRepository.save(e));
    }

    public void delete(Long id) {
        Event e = eventRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Event", id));
        fileStorage.deleteQuietly(e.getImageUrl());
        eventRepository.delete(e);
    }

    private EventDTO toDTO(Event e) {
        EventDTO dto = new EventDTO();
        dto.setId(e.getId()); dto.setTitle(e.getTitle()); dto.setDescription(e.getDescription());
        dto.setImageUrl(e.getImageUrl()); dto.setDate(e.getDate()); dto.setTime(e.getTime());
        dto.setReservationLink(e.getReservationLink()); dto.setActive(e.getActive());
        return dto;
    }
}
