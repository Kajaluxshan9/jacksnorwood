package com.jacksnorwood.jacks_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The application runs on the restaurant's clock.
 *
 * Entities store LocalDate/LocalTime/LocalDateTime, which carry no zone, so
 * every "is this in the past?" decision — an event's display window, a booking
 * date — resolves against the JVM default. If a server were provisioned in UTC,
 * events would appear and disappear four to five hours early without anything
 * failing visibly.
 */
@SpringBootTest
class RestaurantTimeZoneTest {

    @Test
    @DisplayName("the JVM default zone is pinned to Canadian Eastern, whatever the host says")
    void defaultZoneIsPinned() {
        assertThat(TimeZone.getDefault().getID())
                .isEqualTo(JacksBackendApplication.RESTAURANT_TIME_ZONE);
        assertThat(ZoneId.systemDefault().getId()).isEqualTo("America/Toronto");
    }

    @Test
    @DisplayName("LocalDateTime.now() reads the Norwood wall clock")
    void nowFollowsRestaurantClock() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime toronto = ZonedDateTime.now(ZoneId.of("America/Toronto")).toLocalDateTime();

        // Same wall clock to the minute (allowing for the clock ticking between
        // the two reads).
        assertThat(java.time.Duration.between(now, toronto).abs().toSeconds()).isLessThan(5);
    }

    @Test
    @DisplayName("daylight saving comes from the IANA rules, not a fixed offset")
    void daylightSavingApplies() {
        ZoneId zone = ZoneId.of(JacksBackendApplication.RESTAURANT_TIME_ZONE);

        // Summer: EDT, UTC-4.
        assertThat(zone.getRules().getOffset(LocalDateTime.of(2026, 7, 1, 12, 0).toInstant(ZoneOffset.UTC)))
                .isEqualTo(ZoneOffset.ofHours(-4));

        // Winter: EST, UTC-5.
        assertThat(zone.getRules().getOffset(LocalDateTime.of(2026, 1, 1, 12, 0).toInstant(ZoneOffset.UTC)))
                .isEqualTo(ZoneOffset.ofHours(-5));
    }

    @Test
    @DisplayName("Toronto and New York agree, so an Eastern host needs no correction")
    void easternZonesAgree() {
        // The production host is set to America/New_York; it shares Toronto's
        // offsets and DST dates, so behaviour is identical either way.
        assertThat(ZonedDateTime.now(ZoneId.of("America/Toronto")).getOffset())
                .isEqualTo(ZonedDateTime.now(ZoneId.of("America/New_York")).getOffset());
    }
}
