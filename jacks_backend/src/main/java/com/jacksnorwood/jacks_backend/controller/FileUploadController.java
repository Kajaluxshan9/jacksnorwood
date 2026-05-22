package com.jacksnorwood.jacks_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".pdf", ".doc", ".docx"
    );

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        try {
            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf('.')).toLowerCase() : "";

            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed"));
            }

            String filename = UUID.randomUUID() + ext;

            Path dir = Paths.get(uploadDir).toAbsolutePath();
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok(Map.of("url", "/uploads/" + filename));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }
}
