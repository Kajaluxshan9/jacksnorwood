package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDTO>> getUpcoming() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }

    @GetMapping("/all")
    public ResponseEntity<List<EventDTO>> getAll() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @PostMapping
    public ResponseEntity<EventDTO> create(@RequestBody EventDTO dto) {
        return ResponseEntity.ok(eventService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> update(@PathVariable Long id, @RequestBody EventDTO dto) {
        return ResponseEntity.ok(eventService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
