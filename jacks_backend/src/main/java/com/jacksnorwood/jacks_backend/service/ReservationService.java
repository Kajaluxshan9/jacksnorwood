package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.entity.Reservation;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import com.jacksnorwood.jacks_backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationDTO create(ReservationDTO dto) {
        Reservation r = Reservation.builder()
                .name(dto.getName()).email(dto.getEmail()).phone(dto.getPhone())
                .date(dto.getDate()).time(dto.getTime()).guests(dto.getGuests())
                .notes(dto.getNotes()).status(ReservationStatus.PENDING).build();
        return toDTO(reservationRepository.save(r));
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
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + id));
        r.setStatus(newStatus);
        return toDTO(reservationRepository.save(r));
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
