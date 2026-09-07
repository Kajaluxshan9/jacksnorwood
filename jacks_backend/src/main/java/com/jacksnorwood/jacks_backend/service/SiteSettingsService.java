package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.entity.SiteSettings;
import com.jacksnorwood.jacks_backend.repository.SiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteSettingsService {

    private final SiteSettingsRepository repo;

    public Map<String, String> getAll() {
        return repo.findAll().stream()
                .collect(Collectors.toMap(SiteSettings::getKey, s -> s.getValue() != null ? s.getValue() : ""));
    }

    @Transactional
    public void updateAll(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SiteSettings entity = repo.findById(entry.getKey()).orElse(new SiteSettings(entry.getKey(), ""));
            entity.setValue(entry.getValue());
            repo.save(entity);
        }
    }
}
