package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ContactMessageDTO;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

/** Notification email for contact-form submissions. Separate bean so @Async applies. */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactMailer {

    private final JavaMailSender mailSender;
    private final FileStorageService fileStorage;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.restaurant.email:${spring.mail.username:}}")
    private String restaurantEmail;

    @Async("mailExecutor")
    public void notifyRestaurant(ContactMessageDTO dto) {
        if (restaurantEmail == null || restaurantEmail.isBlank()
                || senderEmail == null || senderEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(restaurantEmail);
            // Replying goes straight back to the sender rather than to the site mailbox.
            if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
                helper.setReplyTo(dto.getEmail());
            }
            helper.setSubject("New Contact Message: " + (dto.getSubject() != null ? dto.getSubject() : "General"));
            helper.setText(
                "You have a new message from the website.\n\n" +
                "Name:    " + dto.getName() + "\n" +
                "Email:   " + dto.getEmail() + "\n" +
                "Phone:   " + (dto.getPhone() != null ? dto.getPhone() : "-") + "\n" +
                "Subject: " + (dto.getSubject() != null ? dto.getSubject() : "General") + "\n" +
                "\nMessage:\n" + dto.getMessage()
            );

            if (dto.getCvUrl() != null && !dto.getCvUrl().isBlank()) {
                // resolveExisting refuses anything outside the uploads directory.
                // The previous version resolved the client-supplied path directly,
                // so a crafted cvUrl could attach an arbitrary file from the server.
                File cvFile = fileStorage.resolveExisting(dto.getCvUrl());
                if (cvFile != null) {
                    helper.addAttachment("CV_" + sanitise(dto.getName()) + extensionOf(cvFile.getName()),
                            new FileSystemResource(cvFile));
                } else {
                    log.warn("CV attachment could not be resolved: {}", dto.getCvUrl());
                }
            }

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send contact email: {}", e.getMessage());
        }
    }

    /** Keeps the applicant's name from injecting path or header characters into the filename. */
    private String sanitise(String name) {
        if (name == null || name.isBlank()) return "applicant";
        String cleaned = name.replaceAll("[^A-Za-z0-9 _-]", "").trim().replaceAll("\s+", "_");
        return cleaned.isEmpty() ? "applicant" : cleaned;
    }

    private String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
