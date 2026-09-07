package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ContactMessageDTO;
import com.jacksnorwood.jacks_backend.entity.ContactMessage;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final ContactMailer contactMailer;
    private final FileStorageService fileStorage;

    public ContactMessageDTO send(ContactMessageDTO dto) {
        // A cvUrl is only meaningful if it points at a file we actually hold.
        // Rejecting anything else here stops a crafted path from being stored
        // and later handed to the mailer.
        String cvUrl = dto.getCvUrl();
        if (cvUrl != null && !cvUrl.isBlank() && fileStorage.resolveExisting(cvUrl) == null) {
            throw new BadRequestException("The attached file could not be found. Please upload it again.");
        }

        // Always persist the message so it appears in the admin panel
        ContactMessage saved = contactMessageRepository.save(
            ContactMessage.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .subject(dto.getSubject())
                .cvUrl(cvUrl != null && !cvUrl.isBlank() ? cvUrl : null)
                .message(dto.getMessage())
                .isRead(false)
                .build()
        );

        ContactMessageDTO result = toDTO(saved);
        // Queued, not inline: a slow or unreachable SMTP server must not make the
        // visitor's form submission hang or appear to fail.
        contactMailer.notifyRestaurant(result);
        return result;
    }

    public List<ContactMessageDTO> getAll() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ContactMessageDTO markRead(Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Message", id));
        msg.setIsRead(true);
        return toDTO(contactMessageRepository.save(msg));
    }

    public void delete(Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Message", id));
        // The CV was uploaded solely for this message, so it goes with it.
        fileStorage.deleteQuietly(msg.getCvUrl());
        contactMessageRepository.delete(msg);
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
}
