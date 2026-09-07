package com.jacksnorwood.jacks_backend.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * These DTOs are used for partial updates over PUT, so they must distinguish
 * "the caller did not mention this field" from "the caller explicitly sent null".
 *
 * Without that distinction the services applied every field unconditionally, so
 * any partial payload silently wiped whatever it omitted - a promotion's
 * schedule, a menu item's subcategory, an event's image and booking link.
 */
class PartialUpdateSemanticsTest {

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private <T> T read(String json, Class<T> type) throws Exception {
        return mapper.readValue(json, type);
    }

    // ── MenuItemDTO.subcategoryId ────────────────────────────────────────────

    @Test
    @DisplayName("menu item: omitting subcategoryId means 'leave it alone'")
    void menuItemSubcategoryOmitted() throws Exception {
        MenuItemDTO dto = read("{\"name\":\"Burger\"}", MenuItemDTO.class);

        assertThat(dto.getSubcategoryId()).isNull();
        assertThat(dto.isSubcategoryCleared())
                .as("absent key must not be treated as an instruction to detach")
                .isFalse();
    }

    @Test
    @DisplayName("menu item: an explicit null subcategoryId means 'detach it'")
    void menuItemSubcategoryExplicitNull() throws Exception {
        MenuItemDTO dto = read("{\"name\":\"Burger\",\"subcategoryId\":null}", MenuItemDTO.class);

        assertThat(dto.getSubcategoryId()).isNull();
        assertThat(dto.isSubcategoryCleared()).isTrue();
    }

    @Test
    @DisplayName("menu item: a real subcategoryId is neither absent nor cleared")
    void menuItemSubcategoryProvided() throws Exception {
        MenuItemDTO dto = read("{\"subcategoryId\":7}", MenuItemDTO.class);

        assertThat(dto.getSubcategoryId()).isEqualTo(7L);
        assertThat(dto.isSubcategoryCleared()).isFalse();
    }

    @Test
    @DisplayName("menu item: the bulk-move payload keeps sizes and name untouched")
    void bulkMovePayloadCarriesNothingElse() throws Exception {
        MenuItemDTO dto = read("{\"categoryId\":3,\"subcategoryId\":9}", MenuItemDTO.class);

        assertThat(dto.getCategoryId()).isEqualTo(3L);
        assertThat(dto.getName()).isNull();
        assertThat(dto.getPrice()).isNull();
        assertThat(dto.getSizes()).as("null sizes must mean 'unchanged', not 'clear'").isNull();
    }

    @Test
    @DisplayName("menu item: the presence flag is not serialised back to clients")
    void presenceFlagIsNotSerialised() throws Exception {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setSubcategoryId(4L);

        assertThat(mapper.writeValueAsString(dto)).doesNotContain("subcategoryIdPresent");
    }

    // ── PromotionDTO schedule fields ─────────────────────────────────────────

    @Test
    @DisplayName("promotion: a payload of only {active} leaves the schedule alone")
    void promotionActiveOnly() throws Exception {
        PromotionDTO dto = read("{\"active\":false}", PromotionDTO.class);

        assertThat(dto.isDayOfWeekPresent()).isFalse();
        assertThat(dto.isStartDateTimePresent()).isFalse();
        assertThat(dto.isEndDateTimePresent()).isFalse();
    }

    @Test
    @DisplayName("promotion: explicitly-null schedule fields are treated as 'clear'")
    void promotionExplicitNulls() throws Exception {
        PromotionDTO dto = read(
                "{\"dayOfWeek\":null,\"startDateTime\":null,\"endDateTime\":null}", PromotionDTO.class);

        assertThat(dto.isDayOfWeekPresent()).isTrue();
        assertThat(dto.isStartDateTimePresent()).isTrue();
        assertThat(dto.isEndDateTimePresent()).isTrue();
        assertThat(dto.getDayOfWeek()).isNull();
    }

    @Test
    @DisplayName("promotion: real values are read back correctly")
    void promotionValuesRoundTrip() throws Exception {
        PromotionDTO dto = read(
                "{\"dayOfWeek\":\"Monday\",\"startDateTime\":\"2026-01-05T18:30:00\"}", PromotionDTO.class);

        assertThat(dto.getDayOfWeek()).isEqualTo("Monday");
        assertThat(dto.isDayOfWeekPresent()).isTrue();
        assertThat(dto.getStartDateTime()).isNotNull();
        assertThat(dto.getStartDateTime().getHour()).isEqualTo(18);
        assertThat(dto.isEndDateTimePresent()).isFalse();
    }

    // ── EventDTO imageUrl / reservationLink ──────────────────────────────────

    @Test
    @DisplayName("event: a payload of only {title} keeps the image and booking link")
    void eventTitleOnly() throws Exception {
        EventDTO dto = read("{\"title\":\"Trivia\"}", EventDTO.class);

        assertThat(dto.isImageUrlPresent()).isFalse();
        assertThat(dto.isReservationLinkPresent()).isFalse();
    }

    @Test
    @DisplayName("event: empty strings are a deliberate 'clear this'")
    void eventEmptyStringsClear() throws Exception {
        EventDTO dto = read("{\"imageUrl\":\"\",\"reservationLink\":\"\"}", EventDTO.class);

        assertThat(dto.isImageUrlPresent()).isTrue();
        assertThat(dto.isReservationLinkPresent()).isTrue();
        assertThat(dto.getImageUrl()).isEmpty();
    }

    @Test
    @DisplayName("event: null date and time deserialise cleanly (the admin form sends these)")
    void eventNullDateAndTime() throws Exception {
        EventDTO dto = read("{\"title\":\"TBC\",\"date\":null,\"time\":null}", EventDTO.class);

        assertThat(dto.getDate()).isNull();
        assertThat(dto.getTime()).isNull();
    }
}
