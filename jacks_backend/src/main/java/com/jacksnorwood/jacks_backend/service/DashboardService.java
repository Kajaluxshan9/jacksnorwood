package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.DashboardStatsDTO;
import com.jacksnorwood.jacks_backend.entity.ReservationStatus;
import com.jacksnorwood.jacks_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ReservationRepository reservationRepository;
    private final MenuItemRepository menuItemRepository;
    private final PromotionRepository promotionRepository;
    private final EventRepository eventRepository;
    private final ContactMessageRepository contactMessageRepository;

    public DashboardStatsDTO getStats() {
        return new DashboardStatsDTO(
                reservationRepository.count(),
                reservationRepository.countByStatus(ReservationStatus.PENDING),
                menuItemRepository.count(),
                promotionRepository.findByActiveTrue().size(),
                eventRepository.findByActiveTrueOrderByDateAsc().size(),
                contactMessageRepository.countByIsReadFalse()
        );
    }
}
