package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.GalleryDTO;
import com.jacksnorwood.jacks_backend.service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @GetMapping
    public ResponseEntity<List<GalleryDTO>> getAll(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(galleryService.getByCategory(category));
        }
        return ResponseEntity.ok(galleryService.getAll());
    }

    @PostMapping
    public ResponseEntity<GalleryDTO> create(@RequestBody GalleryDTO dto) {
        return ResponseEntity.ok(galleryService.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        galleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
