package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByActiveTrueOrderByDateAsc();
    List<Event> findAllByOrderByDateAscIdAsc();
}
