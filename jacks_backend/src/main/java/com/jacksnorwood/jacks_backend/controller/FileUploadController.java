package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileStorageService fileStorage;

    /** Admin-only: images used across the site (menu, gallery, hero, promotions, team). */
    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(Map.of("url", fileStorage.storeImage(file)));
        } catch (IOException e) {
            log.error("Image upload failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }

    /**
     * Public: CV/resume attachments for the careers contact form.
     *
     * Separate from the admin image endpoint so job applicants — who are never
     * authenticated — can attach a document without opening up general image
     * uploads. Restricted to PDF/DOC/DOCX by FileStorageService.
     */
    @PostMapping("/cv")
    public ResponseEntity<Map<String, String>> uploadCv(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(Map.of("url", fileStorage.storeDocument(file)));
        } catch (IOException e) {
            log.error("CV upload failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }
}
