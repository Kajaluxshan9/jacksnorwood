package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.HeroImageDTO;
import com.jacksnorwood.jacks_backend.service.HeroImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        heroImageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
