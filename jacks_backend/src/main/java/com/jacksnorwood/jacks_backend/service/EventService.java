package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.entity.Event;
import com.jacksnorwood.jacks_backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
     * What the public "Upcoming Events" page shows: active events whose display
     * window is currently open. See EventRepository for the exact rules.
     */
    public List<EventDTO> getUpcomingEvents() {
        return eventRepository.findVisible(LocalDateTime.now(), LocalDate.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Is this event on the public site right now?
     *
     * Mirrors the repository query so the admin list can show the same verdict
     * without a second round trip, and so the rule is stated once in Java for
     * anyone reading the service.
     */
    static boolean isVisibleNow(Event e, LocalDateTime now) {
        if (!Boolean.TRUE.equals(e.getActive())) return false;
        if (e.getDisplayFrom() != null && e.getDisplayFrom().isAfter(now)) return false;
        if (e.getDisplayUntil() != null) return !e.getDisplayUntil().isBefore(now);
        return e.getDate() == null || !e.getDate().isBefore(now.toLocalDate());
    }

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllByOrderByDateAscIdAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EventDTO create(EventDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new BadRequestException("Event title is required");
        }
        validateWindow(dto.getDisplayFrom(), dto.getDisplayUntil());
        Event e = Event.builder()
                .title(dto.getTitle()).description(dto.getDescription())
                .imageUrl(dto.getImageUrl()).date(dto.getDate()).time(dto.getTime())
                .reservationLink(dto.getReservationLink())
                .displayFrom(dto.getDisplayFrom())
                .displayUntil(dto.getDisplayUntil())
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
        // Validate against the values that will end up stored, not just the
        // ones in this payload - a partial update can move one end of the window
        // while the other stays as it is.
        validateWindow(
                dto.isDisplayFromPresent() ? dto.getDisplayFrom() : e.getDisplayFrom(),
                dto.isDisplayUntilPresent() ? dto.getDisplayUntil() : e.getDisplayUntil());

        if (dto.isDisplayFromPresent())  e.setDisplayFrom(dto.getDisplayFrom());
        if (dto.isDisplayUntilPresent()) e.setDisplayUntil(dto.getDisplayUntil());

        if (dto.isReservationLinkPresent()) {
            String link = dto.getReservationLink();
            e.setReservationLink(link == null || link.isBlank() ? null : link);
        }
        return toDTO(eventRepository.save(e));
    }

    private void validateWindow(LocalDateTime from, LocalDateTime until) {
        if (from != null && until != null && until.isBefore(from)) {
            throw new BadRequestException("The display period must end after it starts");
        }
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
        dto.setDisplayFrom(e.getDisplayFrom());
        dto.setDisplayUntil(e.getDisplayUntil());
        dto.setVisibleNow(isVisibleNow(e, LocalDateTime.now()));
        return dto;
    }
}
