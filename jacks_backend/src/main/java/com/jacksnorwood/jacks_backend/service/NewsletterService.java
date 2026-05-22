package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.NewsletterDTO;
import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import com.jacksnorwood.jacks_backend.repository.NewsletterSubscriberRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final NewsletterSubscriberRepository repo;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public NewsletterDTO subscribe(String email, String name) {
        if (repo.existsByEmail(email)) {
            return toDTO(repo.findByEmail(email).get());
        }
        NewsletterSubscriber sub = NewsletterSubscriber.builder()
                .email(email).name(name).build();
        NewsletterDTO saved = toDTO(repo.save(sub));
        sendWelcomeEmail(email, name);
        return saved;
    }

    public void sendWelcomeEmail(String email, String name) {
        if (senderEmail == null || senderEmail.isBlank()) return;
        try {
            String displayName = (name != null && !name.isBlank()) ? name : "there";
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(email);
            helper.setSubject("Welcome to Jack's Norwood!");
            String html =
                "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;'>" +
                "<div style='max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);'>" +
                "<div style='background:#3d2b1f;padding:24px 32px;'>" +
                "<h1 style='color:#c8922a;margin:0;font-size:22px;'>Jack's Norwood</h1></div>" +
                "<div style='padding:32px;'>" +
                "<h2 style='color:#1c1917;margin-top:0;'>Welcome, " + escape(displayName) + "!</h2>" +
                "<p style='color:#44403c;line-height:1.7;'>Thanks for subscribing to updates from Jack's Norwood. " +
                "You'll be the first to hear about our latest specials, events, and news.</p>" +
                "<p style='color:#44403c;line-height:1.7;'>We look forward to seeing you soon!</p>" +
                "<p style='color:#c8922a;font-weight:bold;'>— The Jack's Norwood Team</p></div>" +
                "<div style='background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;'>" +
                "<p style='color:#a8a29e;font-size:12px;margin:0;'>Reply to this email to unsubscribe.</p>" +
                "</div></div></body></html>";
            helper.setText("Welcome to Jack's Norwood! Thanks for subscribing.", html);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", email, e.getMessage());
        }
    }

    public void notifySubscribers(String subject, String body, String imageUrl) {
        List<NewsletterSubscriber> subscribers = repo.findAll();
        if (subscribers.isEmpty() || senderEmail == null || senderEmail.isBlank()) return;

        // Resolve image file if provided
        File imageFile = null;
        if (imageUrl != null && !imageUrl.isBlank()) {
            String filename = imageUrl.replaceFirst("^/uploads/", "");
            imageFile = new File(uploadDir).toPath().toAbsolutePath().resolve(filename).toFile();
            if (!imageFile.exists()) {
                log.warn("Notification image not found: {}", imageFile.getAbsolutePath());
                imageFile = null;
            }
        }
        final File finalImageFile = imageFile;

        String imgHtml = finalImageFile != null
                ? "<img src='cid:notify-img' style='width:100%;max-width:560px;border-radius:8px;margin:16px 0;display:block;'/>"
                : "";
        String htmlBody =
            "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;'>" +
            "<div style='max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);'>" +
            "<div style='background:#3d2b1f;padding:24px 32px;'>" +
            "<h1 style='color:#c8922a;margin:0;font-size:22px;'>Jack's Norwood</h1></div>" +
            "<div style='padding:32px;'>" +
            "<h2 style='color:#1c1917;margin-top:0;'>" + escape(subject) + "</h2>" +
            imgHtml +
            "<div style='color:#44403c;line-height:1.7;font-size:15px;'>" + escape(body).replace("\n", "<br/>") + "</div></div>" +
            "<div style='background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;'>" +
            "<p style='color:#a8a29e;font-size:12px;margin:0;'>You're receiving this because you subscribed to Jack's Norwood updates. Reply to unsubscribe.</p>" +
            "</div></div></body></html>";

        for (NewsletterSubscriber sub : subscribers) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(senderEmail);
                helper.setTo(sub.getEmail());
                helper.setSubject(subject);
                helper.setText(body, htmlBody);
                if (finalImageFile != null) {
                    helper.addInline("notify-img", new FileSystemResource(finalImageFile));
                }
                mailSender.send(message);
            } catch (Exception e) {
                log.warn("Failed to notify {}: {}", sub.getEmail(), e.getMessage());
            }
        }
    }

    public void notifySubscribers(String subject, String body) {
        notifySubscribers(subject, body, null);
    }

    public void unsubscribe(String email) {
        repo.findByEmail(email).ifPresent(repo::delete);
    }

    public List<NewsletterDTO> getAll() {
        return repo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void sendNewsletter(String subject, String body, String imageUrl) {
        List<NewsletterSubscriber> subscribers = repo.findAll();
        if (subscribers.isEmpty()) return;

        // Resolve image file if provided
        File imageFile = null;
        if (imageUrl != null && !imageUrl.isBlank()) {
            String filename = imageUrl.replaceFirst("^/uploads/", "");
            imageFile = new File(uploadDir).toPath().toAbsolutePath().resolve(filename).toFile();
            if (!imageFile.exists()) {
                log.warn("Newsletter image not found: {}", imageFile.getAbsolutePath());
                imageFile = null;
            }
        }
        final File finalImageFile = imageFile;

        // Build HTML body
        String imgHtml = finalImageFile != null
                ? "<img src='cid:nl-img' style='width:100%;max-width:560px;border-radius:8px;margin:16px 0;display:block;'/>"
                : "";
        String htmlBody =
                "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;'>" +
                "<div style='max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);'>" +
                "<div style='background:#3d2b1f;padding:24px 32px;'>" +
                "<h1 style='color:#c8922a;margin:0;font-size:22px;'>Jack's Norwood</h1>" +
                "</div>" +
                "<div style='padding:32px;'>" +
                "<h2 style='color:#1c1917;margin-top:0;'>" + escape(subject) + "</h2>" +
                imgHtml +
                "<div style='color:#44403c;line-height:1.7;font-size:15px;'>" + escape(body).replace("\n", "<br/>") + "</div>" +
                "</div>" +
                "<div style='background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;'>" +
                "<p style='color:#a8a29e;font-size:12px;margin:0;'>You're receiving this because you subscribed to updates from Jack's Norwood. " +
                "Reply to this email to unsubscribe.</p>" +
                "</div></div></body></html>";

        int sent = 0, failed = 0;
        for (NewsletterSubscriber sub : subscribers) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(senderEmail);
                helper.setTo(sub.getEmail());
                helper.setSubject(subject);
                helper.setText(body, htmlBody);
                if (finalImageFile != null) {
                    helper.addInline("nl-img", new FileSystemResource(finalImageFile));
                }
                mailSender.send(message);
                sent++;
            } catch (Exception e) {
                log.error("Failed to send newsletter to {}: {}", sub.getEmail(), e.getMessage());
                failed++;
            }
        }
        log.info("Newsletter sent: {} succeeded, {} failed", sent, failed);
        if (failed > 0 && sent == 0) {
            throw new RuntimeException("Failed to send newsletter to all subscribers");
        }
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
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
