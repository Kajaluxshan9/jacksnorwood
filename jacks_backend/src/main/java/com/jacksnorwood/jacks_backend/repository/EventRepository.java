package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    /**
     * Genuinely upcoming events: active, and either undated or on/after today.
     * The public page is titled "Upcoming Events" but previously listed every
     * active event including ones that had already happened.
     */
    List<Event> findByActiveTrueAndDateGreaterThanEqualOrderByDateAscTimeAsc(java.time.LocalDate from);

    List<Event> findByActiveTrueAndDateIsNullOrderByIdAsc();

    long countByActiveTrueAndDateGreaterThanEqual(java.time.LocalDate from);

    long countByActiveTrueAndDateIsNull();
    List<Event> findAllByOrderByDateAscIdAsc();
}
