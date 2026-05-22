package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Reservation;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findAllByOrderByCreatedAtDesc();
    long countByStatus(ReservationStatus status);
}
