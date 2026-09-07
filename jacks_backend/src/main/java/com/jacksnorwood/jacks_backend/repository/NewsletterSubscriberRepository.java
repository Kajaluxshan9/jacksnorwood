package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {
    // Case-insensitive lookups: addresses are stored normalised to lower case,
    // but these keep older mixed-case rows reachable too.
    Optional<NewsletterSubscriber> findByEmailIgnoreCase(String email);
}
