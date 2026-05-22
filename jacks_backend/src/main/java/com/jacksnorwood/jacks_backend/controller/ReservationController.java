package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationDTO> create(@RequestBody ReservationDTO dto) {
        return ResponseEntity.ok(reservationService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAll() {
        return ResponseEntity.ok(reservationService.getAll());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(reservationService.updateStatus(id, body.get("status")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
