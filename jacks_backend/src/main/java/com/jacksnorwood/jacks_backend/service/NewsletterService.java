package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.NewsletterDTO;
import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.NewsletterSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Subscriber records. All actual sending is delegated to {@link NewsletterMailer}
 * so it runs asynchronously.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private static final Pattern EMAIL =
            Pattern.compile("^[^@\\s]+@[^@\\s.]+(\\.[^@\\s.]+)+$");

    private final NewsletterSubscriberRepository repo;
    private final NewsletterMailer mailer;

    /**
     * Subscribing is idempotent and case-insensitive.
     *
     * Addresses used to be stored verbatim against a case-sensitive unique
     * constraint, so "Jane@x.com" and "jane@x.com" both subscribed and both
     * received every mailing.
     */
    public NewsletterDTO subscribe(String email, String name) {
        String normalised = normalise(email);
        if (!EMAIL.matcher(normalised).matches()) {
            throw new BadRequestException("Please provide a valid email address");
        }

        return repo.findByEmailIgnoreCase(normalised)
                .map(this::toDTO)
                .orElseGet(() -> {
                    NewsletterSubscriber sub = NewsletterSubscriber.builder()
                            .email(normalised)
                            .name(name != null && !name.isBlank() ? name.trim() : null)
                            .build();
                    NewsletterDTO saved = toDTO(repo.save(sub));
                    mailer.sendWelcome(normalised, name);
                    return saved;
                });
    }

    public void unsubscribe(String email) {
        String normalised = normalise(email);
        if (normalised.isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        repo.findByEmailIgnoreCase(normalised).ifPresent(repo::delete);
    }

    /** Admin: remove a subscriber outright. */
    public void deleteSubscriber(Long id) {
        NewsletterSubscriber sub = repo.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Subscriber", id));
        repo.delete(sub);
    }

    public List<NewsletterDTO> getAll() {
        return repo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long subscriberCount() {
        return repo.count();
    }

    /** Automatic announcement when a promotion or event is published. */
    public void notifySubscribers(String subject, String body, String imageUrl) {
        mailer.broadcast(subject, body, imageUrl, "notify-img");
    }

    public void notifySubscribers(String subject, String body) {
        notifySubscribers(subject, body, null);
    }

    /** Admin-composed newsletter. */
    public void sendNewsletter(String subject, String body, String imageUrl) {
        if (subject == null || subject.isBlank()) {
            throw new BadRequestException("Subject is required");
        }
        if (body == null || body.isBlank()) {
            throw new BadRequestException("Message body is required");
        }
        mailer.broadcast(subject, body, imageUrl, "nl-img");
    }

    private String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private NewsletterDTO toDTO(NewsletterSubscriber s) {
        NewsletterDTO dto = new NewsletterDTO();
        dto.setId(s.getId());
        dto.setEmail(s.getEmail());
        dto.setName(s.getName());
        dto.setSubscribedAt(s.getSubscribedAt());
        return dto;
    }
}
