package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SiteSettingsController {

    private final SiteSettingsService service;

    @GetMapping
    public ResponseEntity<Map<String, String>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateAll(@RequestBody Map<String, String> settings) {
        service.updateAll(settings);
        return ResponseEntity.ok(service.getAll());
    }
}
