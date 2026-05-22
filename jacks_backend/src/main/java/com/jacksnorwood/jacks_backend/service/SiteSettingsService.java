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

    public void update(String key, String value) {
        SiteSettings entity = repo.findById(key).orElse(new SiteSettings(key, ""));
        entity.setValue(value);
        repo.save(entity);
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
