package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.HeroImageDTO;
import com.jacksnorwood.jacks_backend.service.HeroImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hero-images")
@RequiredArgsConstructor
public class HeroImageController {

    private final HeroImageService heroImageService;

    @GetMapping
    public ResponseEntity<List<HeroImageDTO>> getActive() {
        return ResponseEntity.ok(heroImageService.getActive());
    }

    @GetMapping("/all")
    public ResponseEntity<List<HeroImageDTO>> getAll() {
        return ResponseEntity.ok(heroImageService.getAll());
    }

    @PostMapping
    public ResponseEntity<HeroImageDTO> create(@RequestBody HeroImageDTO dto) {
        return ResponseEntity.ok(heroImageService.create(dto));
    }

    /** Toggle active, or move a single image to a given position. */
    @PutMapping("/{id}")
    public ResponseEntity<HeroImageDTO> update(@PathVariable Long id, @RequestBody HeroImageDTO dto) {
        return ResponseEntity.ok(heroImageService.update(id, dto));
    }

    /** Apply a whole new ordering at once. Body: { "ids": [3, 1, 2] } */
    @PutMapping("/reorder")
    public ResponseEntity<List<HeroImageDTO>> reorder(@RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(heroImageService.reorder(body.get("ids")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        heroImageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
