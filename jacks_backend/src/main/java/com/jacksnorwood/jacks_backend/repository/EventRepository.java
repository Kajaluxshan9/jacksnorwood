package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * Everything the public should currently see.
     *
     * An event is visible when all three hold:
     *   1. it is active (the admin switch);
     *   2. its display window has opened — displayFrom is null or already past;
     *   3. its display window has not closed — displayUntil is in the future, or
     *      displayUntil is unset and the event itself has not happened yet.
     *
     * Rule 3's fallback is what keeps older events behaving exactly as before
     * this window existed: with no displayUntil set, an event disappears after
     * its own date, and an undated one stays up.
     *
     * Ordering puts dated events first (soonest first), undated ones last,
     * since there is nothing to sort those by.
     */
    String VISIBLE_WHERE = """
            e.active = true
            and (e.displayFrom is null or e.displayFrom <= :now)
            and (
                  (e.displayUntil is not null and e.displayUntil >= :now)
               or (e.displayUntil is null and (e.date is null or e.date >= :today))
            )
            """;

    @Query("select e from Event e where " + VISIBLE_WHERE
            + " order by case when e.date is null then 1 else 0 end, e.date asc, e.time asc, e.id asc")
    List<Event> findVisible(@Param("now") LocalDateTime now, @Param("today") LocalDate today);

    @Query("select count(e) from Event e where " + VISIBLE_WHERE)
    long countVisible(@Param("now") LocalDateTime now, @Param("today") LocalDate today);

    List<Event> findAllByOrderByDateAscIdAsc();
}
