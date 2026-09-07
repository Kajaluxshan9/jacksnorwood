package com.jacksnorwood.jacks_backend.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jacksnorwood.jacks_backend.controller.*;
import com.jacksnorwood.jacks_backend.dto.ContactMessageDTO;
import com.jacksnorwood.jacks_backend.dto.ReservationDTO;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.security.JwtAuthFilter;
import com.jacksnorwood.jacks_backend.security.JwtTokenProvider;
import com.jacksnorwood.jacks_backend.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer behaviour that the browser depends on: which endpoints are public,
 * what an unauthenticated request gets back, and whether a bad payload produces
 * a readable 400 rather than a 500.
 *
 * Runs as a slice test - no database - so it stays runnable in CI.
 */
@WebMvcTest(controllers = {
        ReservationController.class,
        ContactController.class,
        FileUploadController.class,
        MenuController.class,
        NewsletterController.class,
})
@Import({ com.jacksnorwood.jacks_backend.config.SecurityConfig.class,
          com.jacksnorwood.jacks_backend.exception.GlobalExceptionHandler.class,
          JwtAuthFilter.class,
          JwtTokenProvider.class })
@TestPropertySource(properties = {
        "app.cors.allowed-origins=http://localhost:5173",
        "app.jwt.secret=test-secret-key-that-is-long-enough-for-hmac-sha256-signing",
        "app.jwt.expiration=3600000",
})
class PublicApiWebTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    // Collaborators of the controllers and the security chain.
    @MockitoBean private ReservationService reservationService;
    @MockitoBean private ContactService contactService;
    @MockitoBean private FileStorageService fileStorage;
    @MockitoBean private MenuService menuService;
    @MockitoBean private NewsletterService newsletterService;
    @MockitoBean private UserDetailsServiceImpl userDetailsService;

    private ReservationDTO validBooking() {
        ReservationDTO dto = new ReservationDTO();
        dto.setName("Jane");
        dto.setEmail("jane@example.com");
        dto.setDate(LocalDate.now().plusDays(3));
        dto.setTime(LocalTime.of(19, 0));
        dto.setGuests(2);
        return dto;
    }

    // ── Who can reach what ───────────────────────────────────────────────────

    @Test
    @DisplayName("an unauthenticated request for admin data gets 401, not 403")
    void protectedEndpointsAnswer401() throws Exception {
        // 403 was the old default, and the frontend only auto-logged-out on 401,
        // so an expired session left the admin stuck on a dead page.
        mvc.perform(get("/api/reservations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/contact")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/menu/all")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/newsletter/subscribers")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("public reads stay public")
    void publicReadsArePermitted() throws Exception {
        mvc.perform(get("/api/menu/categories")).andExpect(status().isOk());
        mvc.perform(get("/api/menu")).andExpect(status().isOk());
        mvc.perform(get("/api/menu/popular")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("the CV endpoint is public but the admin image endpoint is not")
    void cvUploadIsPublicAndImageUploadIsNot() throws Exception {
        when(fileStorage.storeDocument(any())).thenReturn("/uploads/abc.pdf");

        MockMultipartFile cv = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "%PDF-1.4".getBytes());

        // An anonymous job applicant must be able to attach a CV; this used to 403.
        mvc.perform(multipart("/api/upload/cv").file(cv))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("/uploads/abc.pdf"));

        MockMultipartFile image = new MockMultipartFile(
                "file", "photo.png", "image/png", "PNG".getBytes());
        mvc.perform(multipart("/api/upload").file(image))
                .andExpect(status().isUnauthorized());
    }

    // ── Validation and error mapping ─────────────────────────────────────────

    @Test
    @DisplayName("an empty booking returns 400 listing the missing fields")
    void emptyBookingIsRejectedWithDetail() throws Exception {
        mvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Name is required")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Email is required")));
    }

    @Test
    @DisplayName("a malformed email is rejected")
    void malformedEmailRejected() throws Exception {
        ReservationDTO dto = validBooking();
        dto.setEmail("not-an-email");

        mvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("valid email")));
    }

    @Test
    @DisplayName("an out-of-range party size is rejected")
    void partySizeIsBounded() throws Exception {
        ReservationDTO dto = validBooking();
        dto.setGuests(0);

        mvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a valid booking is accepted")
    void validBookingAccepted() throws Exception {
        when(reservationService.create(any())).thenReturn(validBooking());

        mvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(validBooking())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("a contact message without a body is rejected")
    void contactRequiresMessage() throws Exception {
        ContactMessageDTO dto = new ContactMessageDTO();
        dto.setName("Jane");
        dto.setEmail("jane@example.com");

        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Message is required")));
    }

    @Test
    @DisplayName("an unparseable date yields 400, not 500")
    void unreadableBodyIsBadRequest() throws Exception {
        // The admin event form used to submit "" for an empty date, which Jackson
        // could not read; that surfaced as an opaque failure.
        mvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"J\",\"email\":\"j@e.com\",\"date\":\"\",\"time\":\"\",\"guests\":2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("a missing record surfaces as 404 with a message")
    void notFoundIsMapped() throws Exception {
        when(menuService.getItemsByCategory(999L))
                .thenThrow(ResourceNotFoundException.of("Category", 999L));

        mvc.perform(get("/api/menu/category/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("not found")));
    }

    @Test
    @DisplayName("subscribing is public and validation errors come back as 400")
    void newsletterSubscribeIsPublic() throws Exception {
        when(newsletterService.subscribe(any(), any()))
                .thenThrow(new com.jacksnorwood.jacks_backend.exception.BadRequestException(
                        "Please provide a valid email address"));

        mvc.perform(post("/api/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nope\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please provide a valid email address"));
    }
}
