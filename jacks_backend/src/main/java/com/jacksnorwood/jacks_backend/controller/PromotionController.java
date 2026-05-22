package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.PromotionDTO;
import com.jacksnorwood.jacks_backend.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ResponseEntity<List<PromotionDTO>> getActive() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/all")
    public ResponseEntity<List<PromotionDTO>> getAll() {
        return ResponseEntity.ok(promotionService.getAllPromotions());
    }

    @PostMapping
    public ResponseEntity<PromotionDTO> create(@RequestBody PromotionDTO dto) {
        return ResponseEntity.ok(promotionService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromotionDTO> update(@PathVariable Long id, @RequestBody PromotionDTO dto) {
        return ResponseEntity.ok(promotionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
