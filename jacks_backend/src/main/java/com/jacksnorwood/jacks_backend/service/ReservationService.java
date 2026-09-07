package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.entity.Reservation;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import com.jacksnorwood.jacks_backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationMailer reservationMailer;

    public ReservationDTO create(ReservationDTO dto) {
        // Field-level rules (required, format, party size) come from @Valid on the
        // DTO. This is the one rule that needs the current date to evaluate.
        if (dto.getDate() != null && dto.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Please choose a date that is not in the past");
        }
        if (dto.getDate() != null && dto.getTime() != null
                && LocalDateTime.of(dto.getDate(), dto.getTime()).isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Please choose a time that is still to come");
        }

        Reservation r = Reservation.builder()
                .name(dto.getName()).email(dto.getEmail()).phone(dto.getPhone())
                .date(dto.getDate()).time(dto.getTime()).guests(dto.getGuests())
                .notes(dto.getNotes()).status(ReservationStatus.PENDING).build();
        Reservation saved = reservationRepository.save(r);
        // Acknowledge to the guest and alert the restaurant (both async).
        reservationMailer.sendReceived(saved);
        return toDTO(saved);
    }

    public List<ReservationDTO> getAll() {
        return reservationRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ReservationDTO updateStatus(Long id, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status must not be blank");
        }
        ReservationStatus newStatus;
        try {
            newStatus = ReservationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + status);
        }
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Reservation", id));

        ReservationStatus previous = r.getStatus();
        r.setStatus(newStatus);
        Reservation saved = reservationRepository.save(r);

        // Tell the guest, but only when the status actually moved — re-clicking
        // "Confirm" on an already-confirmed booking should not re-send.
        if (previous != newStatus) {
            reservationMailer.sendStatusChange(saved);
        }
        return toDTO(saved);
    }

    private ReservationDTO toDTO(Reservation r) {
        ReservationDTO dto = new ReservationDTO();
        dto.setId(r.getId()); dto.setName(r.getName()); dto.setEmail(r.getEmail());
        dto.setPhone(r.getPhone()); dto.setDate(r.getDate()); dto.setTime(r.getTime());
        dto.setGuests(r.getGuests()); dto.setNotes(r.getNotes());
        dto.setStatus(r.getStatus().name()); dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
