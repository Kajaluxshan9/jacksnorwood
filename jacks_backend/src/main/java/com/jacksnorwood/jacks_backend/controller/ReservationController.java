package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    /** Public endpoint — @Valid rejects incomplete bookings with a 400 and a readable message. */
    @PostMapping
    public ResponseEntity<ReservationDTO> create(@Valid @RequestBody ReservationDTO dto) {
        return ResponseEntity.ok(reservationService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAll() {
        return ResponseEntity.ok(reservationService.getAll());
    }

    /**
     * Invalid status values raise IllegalArgumentException, which
     * GlobalExceptionHandler turns into a 400 — the local try/catch that used to
     * do this is no longer needed.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ReservationDTO> updateStatus(@PathVariable Long id,
                                                       @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reservationService.updateStatus(id, body.get("status")));
    }
}
