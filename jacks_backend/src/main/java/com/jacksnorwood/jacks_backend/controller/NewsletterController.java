package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.NewsletterDTO;
import com.jacksnorwood.jacks_backend.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService newsletterService;

    /** Public: subscribe */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        String name = body.getOrDefault("name", "");
        return ResponseEntity.ok(newsletterService.subscribe(email.trim(), name));
    }

    /** Public: unsubscribe */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> body) {
        newsletterService.unsubscribe(body.get("email"));
        return ResponseEntity.noContent().build();
    }

    /** Admin: list all subscribers */
    @GetMapping("/subscribers")
    public ResponseEntity<List<NewsletterDTO>> getAll() {
        return ResponseEntity.ok(newsletterService.getAll());
    }

    /** Admin: send newsletter */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> send(@RequestBody NewsletterDTO dto) {
        newsletterService.sendNewsletter(dto.getSubject(), dto.getBody(), dto.getImageUrl());
        return ResponseEntity.ok(Map.of("message", "Newsletter sent successfully"));
    }
}
