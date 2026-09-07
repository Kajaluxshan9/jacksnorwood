package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.ContactMessageDTO;
import com.jacksnorwood.jacks_backend.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    /** Public endpoint — @Valid enforces the DTO constraints before anything is stored. */
    @PostMapping
    public ResponseEntity<ContactMessageDTO> send(@Valid @RequestBody ContactMessageDTO dto) {
        return ResponseEntity.ok(contactService.send(dto));
    }

    @GetMapping
    public ResponseEntity<List<ContactMessageDTO>> getAll() {
        return ResponseEntity.ok(contactService.getAll());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ContactMessageDTO> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.markRead(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
