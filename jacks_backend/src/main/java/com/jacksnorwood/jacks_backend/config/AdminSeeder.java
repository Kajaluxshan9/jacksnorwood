package com.jacksnorwood.jacks_backend.config;

import com.jacksnorwood.jacks_backend.entity.Role;
import com.jacksnorwood.jacks_backend.entity.User;
import com.jacksnorwood.jacks_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the admin user on first boot in any profile (dev or prod).
 * Credentials are read from environment variables ADMIN_USERNAME and ADMIN_PASSWORD —
 * never hardcoded. This runs before DevDataInitializer (Order 1 vs 2).
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;
        userRepository.save(User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build());
        log.info("Admin user '{}' created from environment configuration.", adminUsername);
    }
}
