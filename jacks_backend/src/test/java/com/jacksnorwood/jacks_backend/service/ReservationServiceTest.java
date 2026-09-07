package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.entity.Reservation;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.ReservationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private ReservationMailer reservationMailer;

    @InjectMocks private ReservationService reservationService;

    private ReservationDTO validBooking() {
        ReservationDTO dto = new ReservationDTO();
        dto.setName("Jane");
        dto.setEmail("jane@example.com");
        dto.setPhone("705-000-0000");
        dto.setDate(LocalDate.now().plusDays(3));
        dto.setTime(LocalTime.of(19, 0));
        dto.setGuests(2);
        return dto;
    }

    private Reservation stored(ReservationStatus status) {
        Reservation r = Reservation.builder()
                .name("Jane").email("jane@example.com")
                .date(LocalDate.now().plusDays(3)).time(LocalTime.of(19, 0))
                .guests(2).status(status).build();
        r.setId(1L);
        return r;
    }

    // ── Booking rules ────────────────────────────────────────────────────────

    @Test
    @DisplayName("a valid future booking is saved as PENDING")
    void createsPendingBooking() {
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationDTO saved = reservationService.create(validBooking());

        assertThat(saved.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("a booking for a past date is rejected")
    void rejectsPastDate() {
        ReservationDTO dto = validBooking();
        dto.setDate(LocalDate.now().minusDays(1));

        assertThatThrownBy(() -> reservationService.create(dto))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not in the past");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("a booking for earlier today is rejected")
    void rejectsTimeAlreadyPassed() {
        ReservationDTO dto = validBooking();
        dto.setDate(LocalDate.now());
        dto.setTime(LocalTime.of(0, 1));

        assertThatThrownBy(() -> reservationService.create(dto))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("still to come");
    }

    @Test
    @DisplayName("booking acknowledges the guest and alerts the restaurant")
    void sendsReceivedEmails() {
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        reservationService.create(validBooking());

        // The booking page promises "we'll confirm your reservation by email";
        // nothing was ever sent before this.
        verify(reservationMailer).sendReceived(any(Reservation.class));
    }

    // ── Status transitions ───────────────────────────────────────────────────

    @Test
    @DisplayName("confirming a pending booking emails the guest")
    void confirmingEmailsGuest() {
        Reservation r = stored(ReservationStatus.PENDING);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(r));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationDTO result = reservationService.updateStatus(1L, "confirmed");

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        verify(reservationMailer).sendStatusChange(r);
    }

    @Test
    @DisplayName("re-confirming an already-confirmed booking does not email again")
    void noDuplicateEmailOnUnchangedStatus() {
        Reservation r = stored(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(r));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        reservationService.updateStatus(1L, "CONFIRMED");

        verify(reservationMailer, never()).sendStatusChange(any());
    }

    @Test
    @DisplayName("an unknown status is a 400, and a missing booking a 404")
    void rejectsBadInput() {
        Reservation r = stored(ReservationStatus.PENDING);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(r));
        when(reservationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.updateStatus(1L, "NONSENSE"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid status");

        assertThatThrownBy(() -> reservationService.updateStatus(1L, "  "))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> reservationService.updateStatus(99L, "CONFIRMED"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
