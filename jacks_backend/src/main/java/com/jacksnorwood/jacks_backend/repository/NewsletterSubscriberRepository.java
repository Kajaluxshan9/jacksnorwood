package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {
    Optional<NewsletterSubscriber> findByEmail(String email);
    boolean existsByEmail(String email);
}
