package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.entity.Event;
import com.jacksnorwood.jacks_backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final NewsletterService newsletterService;

    public List<EventDTO> getUpcomingEvents() {
        return eventRepository.findByActiveTrueOrderByDateAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllByOrderByDateAscIdAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EventDTO create(EventDTO dto) {
        Event e = Event.builder()
                .title(dto.getTitle()).description(dto.getDescription())
                .imageUrl(dto.getImageUrl()).date(dto.getDate()).time(dto.getTime())
                .reservationLink(dto.getReservationLink())
                .active(dto.getActive() != null ? dto.getActive() : true).build();
        EventDTO saved = toDTO(eventRepository.save(e));
        try {
            String body = (saved.getDescription() != null && !saved.getDescription().isBlank())
                    ? saved.getDescription() : "Visit us for this exciting event!";
            newsletterService.notifySubscribers("New Event: " + saved.getTitle(), body);
        } catch (Exception ignored) {}
        return saved;
    }

    public EventDTO update(Long id, EventDTO dto) {
        Event e = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found: " + id));
        if (dto.getTitle() != null)       e.setTitle(dto.getTitle());
        if (dto.getDescription() != null) e.setDescription(dto.getDescription());
        if (dto.getDate() != null)        e.setDate(dto.getDate());
        if (dto.getTime() != null)        e.setTime(dto.getTime());
        if (dto.getActive() != null)      e.setActive(dto.getActive());
        // Always apply these so they can be cleared by sending empty string or null
        e.setImageUrl(dto.getImageUrl());
        e.setReservationLink(dto.getReservationLink());
        return toDTO(eventRepository.save(e));
    }

    public void delete(Long id) { eventRepository.deleteById(id); }

    private EventDTO toDTO(Event e) {
        EventDTO dto = new EventDTO();
        dto.setId(e.getId()); dto.setTitle(e.getTitle()); dto.setDescription(e.getDescription());
        dto.setImageUrl(e.getImageUrl()); dto.setDate(e.getDate()); dto.setTime(e.getTime());
        dto.setReservationLink(e.getReservationLink()); dto.setActive(e.getActive());
        return dto;
    }
}
