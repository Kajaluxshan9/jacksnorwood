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
    public ResponseEntity<NewsletterDTO> subscribe(@RequestBody Map<String, String> body) {
        // Validation (blank / malformed address) lives in the service and surfaces
        // as a 400 through GlobalExceptionHandler.
        return ResponseEntity.ok(newsletterService.subscribe(body.get("email"), body.getOrDefault("name", "")));
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

    /** Admin: remove a subscriber */
    @DeleteMapping("/subscribers/{id}")
    public ResponseEntity<Void> deleteSubscriber(@PathVariable Long id) {
        newsletterService.deleteSubscriber(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Admin: send a newsletter.
     *
     * Returns as soon as the send is queued — the delivery itself runs on the
     * mail executor, so a large subscriber list no longer holds the request open
     * past the gateway timeout.
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> send(@RequestBody NewsletterDTO dto) {
        newsletterService.sendNewsletter(dto.getSubject(), dto.getBody(), dto.getImageUrl());
        return ResponseEntity.accepted().body(Map.of(
                "message", "Newsletter queued for delivery",
                "recipients", newsletterService.subscriberCount()));
    }
}
