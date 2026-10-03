package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.entity.Event;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The publication window: when an event is advertised, as distinct from when it
 * happens.
 *
 * The motivating case is a Thanksgiving menu — pre-orders open a week before the
 * event date and pickup runs for days after it, so the poster has to go up early
 * and stay up late. Before this, an event vanished the day after its own date.
 */
@SpringBootTest
@Transactional
class EventDisplayWindowTest {

    @Autowired private EventService eventService;
    @Autowired private EventRepository eventRepository;

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 3, 12, 0);

    @BeforeEach
    void clean() {
        eventRepository.deleteAll();
    }

    private Event.EventBuilder base(String title) {
        return Event.builder().title(title).active(true);
    }

    private List<String> publiclyVisible() {
        return eventService.getUpcomingEvents().stream().map(EventDTO::getTitle).toList();
    }

    // ── The rules, evaluated in Java ─────────────────────────────────────────
    @Nested
    class VisibilityRules {

        @Test
        @DisplayName("an inactive event is never shown, whatever its window says")
        void inactiveAlwaysHidden() {
            Event e = base("Draft").active(false)
                    .displayFrom(NOW.minusDays(1)).displayUntil(NOW.plusDays(1)).build();
            assertThat(EventService.isVisibleNow(e, NOW)).isFalse();
        }

        @Test
        @DisplayName("hidden before the window opens, shown once it has")
        void respectsStart() {
            assertThat(EventService.isVisibleNow(base("Soon").displayFrom(NOW.plusHours(1)).build(), NOW)).isFalse();
            assertThat(EventService.isVisibleNow(base("Live").displayFrom(NOW.minusHours(1)).build(), NOW)).isTrue();
        }

        @Test
        @DisplayName("stays up until the window closes, even past the event date")
        void endOutlivesEventDate() {
            // The Thanksgiving case: event on the 9th, pickup until the 12th.
            Event e = base("Thanksgiving")
                    .date(NOW.toLocalDate().minusDays(2))
                    .displayUntil(NOW.plusDays(3)).build();

            assertThat(EventService.isVisibleNow(e, NOW))
                    .as("an explicit end date must override the event date")
                    .isTrue();
        }

        @Test
        @DisplayName("hidden once the window has closed")
        void respectsEnd() {
            assertThat(EventService.isVisibleNow(base("Over").displayUntil(NOW.minusMinutes(1)).build(), NOW)).isFalse();
        }

        @Test
        @DisplayName("with no window set, behaviour is unchanged from before")
        void backwardsCompatible() {
            // Every event that already exists has both ends null.
            assertThat(EventService.isVisibleNow(base("Future").date(NOW.toLocalDate().plusDays(1)).build(), NOW)).isTrue();
            assertThat(EventService.isVisibleNow(base("Today").date(NOW.toLocalDate()).build(), NOW)).isTrue();
            assertThat(EventService.isVisibleNow(base("Past").date(NOW.toLocalDate().minusDays(1)).build(), NOW)).isFalse();
            assertThat(EventService.isVisibleNow(base("Undated").build(), NOW)).isTrue();
        }

        @Test
        @DisplayName("the window boundaries themselves count as inside")
        void boundariesInclusive() {
            assertThat(EventService.isVisibleNow(base("Opens now").displayFrom(NOW).build(), NOW)).isTrue();
            assertThat(EventService.isVisibleNow(base("Closes now").displayUntil(NOW).build(), NOW)).isTrue();
        }
    }

    // ── The same rules, evaluated by the database ────────────────────────────
    @Nested
    class Query {

        @Test
        @DisplayName("the public list matches the Java rule, case for case")
        void queryAgreesWithJava() {
            LocalDate today = NOW.toLocalDate();
            eventRepository.save(base("Scheduled").displayFrom(NOW.plusDays(2)).build());
            eventRepository.save(base("Live now").displayFrom(NOW.minusDays(1)).displayUntil(NOW.plusDays(1)).build());
            eventRepository.save(base("Ended").displayUntil(NOW.minusDays(1)).build());
            eventRepository.save(base("Past, extended").date(today.minusDays(2)).displayUntil(NOW.plusDays(3)).build());
            eventRepository.save(base("Past, no window").date(today.minusDays(2)).build());
            eventRepository.save(base("Future").date(today.plusDays(5)).build());
            eventRepository.save(base("Undated").build());
            eventRepository.save(base("Inactive").active(false).build());

            List<String> visible = eventRepository.findVisible(NOW, today).stream().map(Event::getTitle).toList();

            assertThat(visible).containsExactlyInAnyOrder("Live now", "Past, extended", "Future", "Undated");
            assertThat(eventRepository.countVisible(NOW, today)).isEqualTo(4);
        }

        @Test
        @DisplayName("dated events come first, soonest first; undated last")
        void ordering() {
            LocalDate today = NOW.toLocalDate();
            eventRepository.save(base("Undated").build());
            eventRepository.save(base("Later").date(today.plusDays(9)).time(LocalTime.of(19, 0)).build());
            eventRepository.save(base("Sooner").date(today.plusDays(2)).time(LocalTime.of(18, 0)).build());

            assertThat(eventRepository.findVisible(NOW, today).stream().map(Event::getTitle).toList())
                    .containsExactly("Sooner", "Later", "Undated");
        }
    }

    // ── Service behaviour ────────────────────────────────────────────────────
    @Nested
    class ServiceBehaviour {

        @Test
        @DisplayName("a window that ends before it starts is rejected")
        void rejectsInvertedWindow() {
            EventDTO dto = new EventDTO();
            dto.setTitle("Backwards");
            dto.setDisplayFrom(NOW.plusDays(2));
            dto.setDisplayUntil(NOW.plusDays(1));

            assertThatThrownBy(() -> eventService.create(dto))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("end after it starts");
        }

        @Test
        @DisplayName("a partial update is validated against the stored window, not just the payload")
        void partialUpdateValidatedAgainstStored() {
            EventDTO create = new EventDTO();
            create.setTitle("Promo");
            create.setDisplayFrom(LocalDateTime.of(2026, 10, 1, 0, 0));
            create.setDisplayUntil(LocalDateTime.of(2026, 10, 12, 0, 0));
            Long id = eventService.create(create).getId();

            // Moving only the end before the stored start must still be caught.
            EventDTO patch = new EventDTO();
            patch.setDisplayUntil(LocalDateTime.of(2026, 9, 1, 0, 0));
            assertThatThrownBy(() -> eventService.update(id, patch))
                    .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("an update that does not mention the window leaves it intact")
        void partialUpdateKeepsWindow() {
            EventDTO create = new EventDTO();
            create.setTitle("Promo");
            create.setDisplayFrom(LocalDateTime.of(2026, 10, 1, 0, 0));
            create.setDisplayUntil(LocalDateTime.of(2026, 10, 12, 0, 0));
            Long id = eventService.create(create).getId();

            EventDTO patch = new EventDTO();
            patch.setTitle("Promo renamed");
            EventDTO updated = eventService.update(id, patch);

            assertThat(updated.getDisplayFrom()).isEqualTo(LocalDateTime.of(2026, 10, 1, 0, 0));
            assertThat(updated.getDisplayUntil()).isEqualTo(LocalDateTime.of(2026, 10, 12, 0, 0));
        }

        @Test
        @DisplayName("the window can be cleared by sending nulls explicitly")
        void windowCanBeCleared() {
            EventDTO create = new EventDTO();
            create.setTitle("Promo");
            create.setDisplayFrom(LocalDateTime.of(2026, 10, 1, 0, 0));
            create.setDisplayUntil(LocalDateTime.of(2026, 10, 12, 0, 0));
            Long id = eventService.create(create).getId();

            EventDTO patch = new EventDTO();
            patch.setDisplayFrom(null);
            patch.setDisplayUntil(null);
            EventDTO updated = eventService.update(id, patch);

            assertThat(updated.getDisplayFrom()).isNull();
            assertThat(updated.getDisplayUntil()).isNull();
        }

        @Test
        @DisplayName("a scheduled event is saved but kept off the public page until its time")
        void scheduledEventIsHiddenUntilDue() {
            EventDTO dto = new EventDTO();
            dto.setTitle("Christmas Menu");
            dto.setDisplayFrom(LocalDateTime.now().plusDays(7));
            EventDTO saved = eventService.create(dto);

            assertThat(saved.getVisibleNow()).isFalse();
            assertThat(publiclyVisible()).doesNotContain("Christmas Menu");
            assertThat(eventService.getAllEvents()).extracting(EventDTO::getTitle)
                    .as("still listed in admin, so it can be edited before it goes live")
                    .contains("Christmas Menu");
        }

        @Test
        @DisplayName("visibleNow is reported back so the admin list can show status")
        void reportsVisibility() {
            EventDTO live = new EventDTO();
            live.setTitle("Live");
            live.setDisplayFrom(LocalDateTime.now().minusDays(1));
            live.setDisplayUntil(LocalDateTime.now().plusDays(1));

            assertThat(eventService.create(live).getVisibleNow()).isTrue();
        }
    }
}
