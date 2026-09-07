package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.EventDTO;
import com.jacksnorwood.jacks_backend.dto.PromotionDTO;
import com.jacksnorwood.jacks_backend.entity.Event;
import com.jacksnorwood.jacks_backend.entity.NewsletterSubscriber;
import com.jacksnorwood.jacks_backend.entity.Promotion;
import com.jacksnorwood.jacks_backend.entity.PromotionType;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.repository.EventRepository;
import com.jacksnorwood.jacks_backend.repository.NewsletterSubscriberRepository;
import com.jacksnorwood.jacks_backend.repository.PromotionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NewsletterAndContentServiceTest {

    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    class Newsletter {

        @Mock private NewsletterSubscriberRepository repo;
        @Mock private NewsletterMailer mailer;
        @InjectMocks private NewsletterService service;

        @Test
        @DisplayName("addresses are stored lower-cased and trimmed")
        void normalisesEmail() {
            when(repo.findByEmailIgnoreCase("jane@example.com")).thenReturn(Optional.empty());
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThat(service.subscribe("  Jane@Example.COM ", "Jane").getEmail())
                    .isEqualTo("jane@example.com");
        }

        @Test
        @DisplayName("subscribing twice with different casing does not create a second row")
        void subscribeIsIdempotent() {
            NewsletterSubscriber existing = NewsletterSubscriber.builder()
                    .email("jane@example.com").name("Jane").build();
            existing.setId(1L);
            when(repo.findByEmailIgnoreCase("jane@example.com")).thenReturn(Optional.of(existing));

            service.subscribe("JANE@example.com", "Jane");

            verify(repo, never()).save(any());
            verify(mailer, never()).sendWelcome(anyString(), anyString());
        }

        @Test
        @DisplayName("a new subscriber gets a welcome email")
        void welcomesNewSubscriber() {
            when(repo.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.subscribe("new@example.com", "New");

            verify(mailer).sendWelcome(eq("new@example.com"), eq("New"));
        }

        @Test
        @DisplayName("malformed addresses are rejected")
        void rejectsInvalidEmail() {
            for (String bad : List.of("not-an-email", "", "  ", "a@b", "@example.com", "a b@example.com")) {
                assertThatThrownBy(() -> service.subscribe(bad, ""))
                        .as("should reject: '%s'", bad)
                        .isInstanceOf(BadRequestException.class);
            }
        }

        @Test
        @DisplayName("sending a newsletter requires a subject and body, and is queued not inline")
        void sendNewsletterValidatesThenDelegates() {
            assertThatThrownBy(() -> service.sendNewsletter("", "body", null))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("Subject");
            assertThatThrownBy(() -> service.sendNewsletter("subject", "  ", null))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("body");

            service.sendNewsletter("Subject", "Body", "/uploads/x.jpg");

            verify(mailer).broadcast("Subject", "Body", "/uploads/x.jpg", "nl-img");
        }

        @Test
        @DisplayName("unsubscribing is case-insensitive and requires an address")
        void unsubscribe() {
            NewsletterSubscriber existing = NewsletterSubscriber.builder().email("jane@example.com").build();
            when(repo.findByEmailIgnoreCase("jane@example.com")).thenReturn(Optional.of(existing));

            service.unsubscribe("JANE@Example.com");
            verify(repo).delete(existing);

            assertThatThrownBy(() -> service.unsubscribe("  "))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    class Events {

        @Mock private EventRepository eventRepository;
        @Mock private NewsletterService newsletterService;
        @Mock private FileStorageService fileStorage;
        @InjectMocks private EventService service;

        @Test
        @DisplayName("'upcoming' excludes past events and includes undated ones")
        void upcomingUsesDateFilter() {
            Event future = Event.builder().title("Future").date(LocalDate.now().plusDays(5)).active(true).build();
            Event undated = Event.builder().title("Undated").active(true).build();
            when(eventRepository.findByActiveTrueAndDateGreaterThanEqualOrderByDateAscTimeAsc(any()))
                    .thenReturn(List.of(future));
            when(eventRepository.findByActiveTrueAndDateIsNullOrderByIdAsc()).thenReturn(List.of(undated));

            List<EventDTO> result = service.getUpcomingEvents();

            assertThat(result).extracting(EventDTO::getTitle).containsExactly("Future", "Undated");
            // The old implementation returned every active event regardless of date.
            verify(eventRepository).findByActiveTrueAndDateGreaterThanEqualOrderByDateAscTimeAsc(LocalDate.now());
        }

        @Test
        @DisplayName("only active events are announced to subscribers")
        void announcesOnlyActiveEvents() {
            when(eventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            EventDTO inactive = new EventDTO();
            inactive.setTitle("Draft");
            inactive.setActive(false);
            service.create(inactive);
            verify(newsletterService, never()).notifySubscribers(anyString(), anyString(), any());

            EventDTO live = new EventDTO();
            live.setTitle("Live");
            live.setActive(true);
            service.create(live);
            verify(newsletterService).notifySubscribers(contains("Live"), anyString(), any());
        }

        @Test
        @DisplayName("an event needs a title")
        void requiresTitle() {
            EventDTO dto = new EventDTO();
            dto.setTitle("  ");
            assertThatThrownBy(() -> service.create(dto)).isInstanceOf(BadRequestException.class);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    class Promotions {

        @Mock private PromotionRepository promotionRepository;
        @Mock private NewsletterService newsletterService;
        @Mock private FileStorageService fileStorage;
        @InjectMocks private PromotionService service;

        private PromotionDTO daily(String day) {
            PromotionDTO dto = new PromotionDTO();
            dto.setTitle("Wing Night");
            dto.setPromotionType(PromotionType.DAILY);
            dto.setDayOfWeek(day);
            dto.setActive(true);
            return dto;
        }

        @Test
        @DisplayName("a daily special must name a valid day")
        void dailyRequiresValidDay() {
            assertThatThrownBy(() -> service.create(daily(null)))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("day of the week");

            assertThatThrownBy(() -> service.create(daily("Funday")))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("Unknown day");
        }

        @Test
        @DisplayName("a valid daily special is accepted and announced")
        void acceptsValidDaily() {
            when(promotionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.create(daily("Monday"));

            verify(newsletterService).notifySubscribers(contains("Wing Night"), anyString(), any());
        }

        @Test
        @DisplayName("an inactive promotion is not announced")
        void inactiveIsNotAnnounced() {
            when(promotionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PromotionDTO dto = daily("Monday");
            dto.setActive(false);
            service.create(dto);

            verify(newsletterService, never()).notifySubscribers(anyString(), anyString(), any());
        }

        @Test
        @DisplayName("an end date before the start is rejected")
        void rejectsInvertedDateRange() {
            PromotionDTO dto = new PromotionDTO();
            dto.setTitle("Special");
            dto.setPromotionType(PromotionType.SPECIAL);
            dto.setStartDateTime(LocalDateTime.of(2026, 5, 10, 18, 0));
            dto.setEndDateTime(LocalDateTime.of(2026, 5, 1, 18, 0));

            assertThatThrownBy(() -> service.create(dto))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("after the start");
        }

        @Test
        @DisplayName("a partial update keeps the day and dates it did not mention")
        void partialUpdateKeepsSchedule() {
            Promotion existing = Promotion.builder()
                    .title("Wing Night").promotionType(PromotionType.DAILY)
                    .dayOfWeek("Monday").active(true)
                    .startDateTime(LocalDateTime.of(2026, 5, 1, 17, 0)).build();
            existing.setId(1L);
            when(promotionRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(promotionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PromotionDTO patch = new PromotionDTO();
            patch.setActive(false);   // nothing else touched

            service.update(1L, patch);

            assertThat(existing.getDayOfWeek()).isEqualTo("Monday");
            assertThat(existing.getStartDateTime()).isNotNull();
            assertThat(existing.getActive()).isFalse();
        }
    }
}
