package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import com.jacksnorwood.jacks_backend.repository.NewsletterSubscriberRepository;
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
import java.util.List;

/**
 * All outbound newsletter mail.
 *
 * Kept in its own bean on purpose: these methods used to live on
 * NewsletterService and were called from within that same class, so an @Async
 * annotation there would have been bypassed by self-invocation and the send
 * would have stayed on the request thread. Crossing a bean boundary is what
 * makes the proxy — and therefore the async dispatch — actually apply.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterMailer {

    private final NewsletterSubscriberRepository repo;
    private final JavaMailSender mailSender;
    private final FileStorageService fileStorage;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    private boolean mailDisabled() {
        return senderEmail == null || senderEmail.isBlank();
    }

    // ── Welcome ───────────────────────────────────────────────────────────────

    @Async("mailExecutor")
    public void sendWelcome(String email, String name) {
        if (mailDisabled()) return;
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
                "<p style='color:#c8922a;font-weight:bold;'>&mdash; The Jack's Norwood Team</p></div>" +
                "<div style='background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;'>" +
                "<p style='color:#a8a29e;font-size:12px;margin:0;'>Reply to this email to unsubscribe.</p>" +
                "</div></div></body></html>";
            helper.setText("Welcome to Jack's Norwood! Thanks for subscribing.", html);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", email, e.getMessage());
        }
    }

    // ── Broadcast ─────────────────────────────────────────────────────────────

    /**
     * Sends to every subscriber. Runs off the request thread so that saving a
     * promotion, or pressing "Send Newsletter", returns immediately instead of
     * blocking for the length of the whole blast (which used to time out and
     * report failure for work that had in fact succeeded).
     */
    @Async("mailExecutor")
    public void broadcast(String subject, String body, String imageUrl, String cid) {
        if (mailDisabled()) {
            log.warn("Mail is not configured; skipping broadcast '{}'", subject);
            return;
        }

        List<NewsletterSubscriber> subscribers = repo.findAll();
        if (subscribers.isEmpty()) return;

        File imageFile = null;
        if (imageUrl != null && !imageUrl.isBlank()) {
            imageFile = fileStorage.resolveExisting(imageUrl);
            if (imageFile == null) {
                log.warn("Broadcast image could not be resolved, sending without it: {}", imageUrl);
            }
        }

        String imgHtml = imageFile != null
                ? "<img src='cid:" + cid + "' style='width:100%;max-width:560px;border-radius:8px;margin:16px 0;display:block;'/>"
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
                if (imageFile != null) {
                    helper.addInline(cid, new FileSystemResource(imageFile));
                }
                mailSender.send(message);
                sent++;
            } catch (Exception e) {
                log.warn("Failed to send '{}' to {}: {}", subject, sub.getEmail(), e.getMessage());
                failed++;
            }
        }
        log.info("Broadcast '{}': {} succeeded, {} failed", subject, sent, failed);
    }

    static String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
