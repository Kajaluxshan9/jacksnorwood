package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ContactMessageDTO;
import com.jacksnorwood.jacks_backend.entity.ContactMessage;
import com.jacksnorwood.jacks_backend.repository.ContactMessageRepository;
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
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.restaurant.email:${spring.mail.username:}}")
    private String restaurantEmail;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public ContactMessageDTO send(ContactMessageDTO dto) {
        // Always persist the message so it appears in the admin panel
        ContactMessage saved = contactMessageRepository.save(
            ContactMessage.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .subject(dto.getSubject())
                .cvUrl(dto.getCvUrl())
                .message(dto.getMessage())
                .isRead(false)
                .build()
        );

        // Attempt email notification (best-effort, never blocks the response)
        if (restaurantEmail != null && !restaurantEmail.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true);
                helper.setFrom(senderEmail);
                helper.setTo(restaurantEmail);
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
                    String filename = dto.getCvUrl().replaceFirst("^/uploads/", "");
                    File cvFile = new File(uploadDir).toPath().toAbsolutePath()
                            .resolve(filename).toFile();
                    if (cvFile.exists()) {
                        helper.addAttachment("CV_" + dto.getName() + getExtension(filename), new FileSystemResource(cvFile));
                    } else {
                        log.warn("CV file not found on disk: {}", cvFile.getAbsolutePath());
                    }
                }

                mailSender.send(message);
            } catch (Exception e) {
                log.warn("Failed to send contact email: {}", e.getMessage());
            }
        }

        return toDTO(saved);
    }

    public List<ContactMessageDTO> getAll() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ContactMessageDTO markRead(Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
        msg.setIsRead(true);
        return toDTO(contactMessageRepository.save(msg));
    }

    private ContactMessageDTO toDTO(ContactMessage m) {
        ContactMessageDTO dto = new ContactMessageDTO();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setEmail(m.getEmail());
        dto.setPhone(m.getPhone());
        dto.setSubject(m.getSubject());
        dto.setCvUrl(m.getCvUrl());
        dto.setMessage(m.getMessage());
        dto.setCreatedAt(m.getCreatedAt());
        dto.setIsRead(m.getIsRead());
        return dto;
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
