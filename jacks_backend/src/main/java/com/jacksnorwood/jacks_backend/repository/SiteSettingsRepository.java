package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteSettingsRepository extends JpaRepository<SiteSettings, String> {
}
