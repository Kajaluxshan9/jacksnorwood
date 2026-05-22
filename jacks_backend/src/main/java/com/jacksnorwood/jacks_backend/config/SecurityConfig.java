package com.jacksnorwood.jacks_backend.config;

import com.jacksnorwood.jacks_backend.security.JwtAuthFilter;
import com.jacksnorwood.jacks_backend.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/upload").hasRole("ADMIN")
                // Public read endpoints — active/public data only
                .requestMatchers(HttpMethod.GET, "/api/menu/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/subcategories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/subcategories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/popular").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/category/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu").permitAll()
                // /api/menu/all is admin-only (returns inactive items)
                .requestMatchers(HttpMethod.GET, "/api/menu/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/promotions").permitAll()
                // /api/promotions/all is admin-only
                .requestMatchers(HttpMethod.GET, "/api/promotions/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
                // /api/events/all is admin-only
                .requestMatchers(HttpMethod.GET, "/api/events/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/gallery").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/team").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hero-images").permitAll()
                // /api/hero-images/all is admin-only
                .requestMatchers(HttpMethod.GET, "/api/hero-images/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/hero-images/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/hero-images/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/settings").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/settings").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()
                // Newsletter: subscribe/unsubscribe public; send/list admin only
                .requestMatchers(HttpMethod.POST, "/api/newsletter/subscribe").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/newsletter/unsubscribe").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/newsletter/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/newsletter/send").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/menu/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/menu/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/menu/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/promotions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/promotions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/promotions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/gallery/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/gallery/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/reservations").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/reservations/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/contact").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/contact/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
