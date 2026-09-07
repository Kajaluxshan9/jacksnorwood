package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.entity.Reservation;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Reservation emails.
 *
 * The booking page tells guests "We'll confirm your reservation by email", but
 * nothing was ever sent — not on booking, not on confirmation, and the
 * restaurant was never notified either.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationMailer {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.CANADA);
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("h:mm a", Locale.CANADA);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.restaurant.email:${spring.mail.username:}}")
    private String restaurantEmail;

    private boolean mailDisabled() {
        return senderEmail == null || senderEmail.isBlank();
    }

    /** Acknowledgement to the guest plus a heads-up to the restaurant. */
    @Async("mailExecutor")
    public void sendReceived(Reservation r) {
        if (mailDisabled()) return;

        send(r.getEmail(), "We've received your booking — Jack's Norwood",
                "Hi " + r.getName() + ",\n\n" +
                "Thanks for booking with Jack's Norwood. We've received your request and " +
                "will confirm it shortly.\n\n" + details(r) +
                "\nIf anything changes, just reply to this email or give us a call.\n\n" +
                "— The Jack's Norwood Team",
                card(r, "Booking received", "We'll confirm your table shortly."));

        if (restaurantEmail != null && !restaurantEmail.isBlank()) {
            send(restaurantEmail, "New reservation request — " + r.getName(),
                    "A new reservation has come in from the website.\n\n" + details(r) +
                    "\nContact: " + r.getEmail() + (r.getPhone() != null ? " / " + r.getPhone() : ""),
                    null);
        }
    }

    /** Fired when an admin confirms or cancels a booking. */
    @Async("mailExecutor")
    public void sendStatusChange(Reservation r) {
        if (mailDisabled()) return;

        if (r.getStatus() == ReservationStatus.CONFIRMED) {
            send(r.getEmail(), "Your table is confirmed — Jack's Norwood",
                    "Hi " + r.getName() + ",\n\nGood news, your table is confirmed.\n\n" + details(r) +
                    "\nWe look forward to seeing you!\n\n— The Jack's Norwood Team",
                    card(r, "Table confirmed", "We look forward to seeing you."));
        } else if (r.getStatus() == ReservationStatus.CANCELLED) {
            send(r.getEmail(), "Your booking has been cancelled — Jack's Norwood",
                    "Hi " + r.getName() + ",\n\nYour reservation below has been cancelled.\n\n" + details(r) +
                    "\nIf this was unexpected, please call us and we'll sort it out.\n\n— The Jack's Norwood Team",
                    card(r, "Booking cancelled", "Please call us if this was unexpected."));
        }
        // PENDING is an internal reset; the guest does not need an email for it.
    }

    private String details(Reservation r) {
        return "Name:   " + r.getName() + "\n" +
               "Date:   " + (r.getDate() != null ? r.getDate().format(DATE_FMT) : "-") + "\n" +
               "Time:   " + (r.getTime() != null ? r.getTime().format(TIME_FMT) : "-") + "\n" +
               "Guests: " + r.getGuests() + "\n" +
               (r.getNotes() != null && !r.getNotes().isBlank() ? "Notes:  " + r.getNotes() + "\n" : "");
    }

    private String card(Reservation r, String heading, String subheading) {
        String esc = NewsletterMailer.escape(r.getName());
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;'>" +
               "<div style='max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);'>" +
               "<div style='background:#3d2b1f;padding:24px 32px;'>" +
               "<h1 style='color:#c8922a;margin:0;font-size:22px;'>Jack's Norwood</h1></div>" +
               "<div style='padding:32px;'>" +
               "<h2 style='color:#1c1917;margin-top:0;'>" + NewsletterMailer.escape(heading) + "</h2>" +
               "<p style='color:#44403c;line-height:1.7;'>Hi " + esc + ", " +
               NewsletterMailer.escape(subheading) + "</p>" +
               "<table style='width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;color:#44403c;'>" +
               row("Date", r.getDate() != null ? r.getDate().format(DATE_FMT) : "-") +
               row("Time", r.getTime() != null ? r.getTime().format(TIME_FMT) : "-") +
               row("Guests", String.valueOf(r.getGuests())) +
               "</table>" +
               "<p style='color:#c8922a;font-weight:bold;'>&mdash; The Jack's Norwood Team</p></div>" +
               "</div></body></html>";
    }

    private String row(String label, String value) {
        return "<tr><td style='padding:8px 0;border-bottom:1px solid #e7e5e4;color:#a8a29e;'>" + label +
               "</td><td style='padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600;'>" +
               NewsletterMailer.escape(value) + "</td></tr>";
    }

    private void send(String to, String subject, String text, String html) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            if (html != null) {
                helper.setText(text, html);
            } else {
                helper.setText(text);
            }
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send reservation email to {}: {}", to, e.getMessage());
        }
    }
}
