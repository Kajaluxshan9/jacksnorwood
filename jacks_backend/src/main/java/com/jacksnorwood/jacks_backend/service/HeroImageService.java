package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.HeroImageDTO;
import com.jacksnorwood.jacks_backend.entity.HeroImage;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.HeroImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeroImageService {

    private final HeroImageRepository repo;
    private final FileStorageService fileStorage;

    public List<HeroImageDTO> getActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<HeroImageDTO> getAll() {
        return repo.findAllByOrderByDisplayOrderAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public HeroImageDTO create(HeroImageDTO dto) {
        if (dto.getImageUrl() == null || dto.getImageUrl().isBlank()) {
            throw new BadRequestException("An image is required");
        }
        HeroImage img = HeroImage.builder()
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : nextDisplayOrder())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        return toDTO(repo.save(img));
    }

    /**
     * Toggle visibility or change position.
     *
     * The entity has carried `active` and `displayOrder` all along and the admin
     * page describes them, but there was no endpoint to change either — the only
     * way to hide a hero image was to delete it.
     */
    public HeroImageDTO update(Long id, HeroImageDTO dto) {
        HeroImage img = repo.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Hero image", id));
        if (dto.getActive() != null)       img.setActive(dto.getActive());
        if (dto.getDisplayOrder() != null) img.setDisplayOrder(dto.getDisplayOrder());
        return toDTO(repo.save(img));
    }

    /** Applies an explicit ordering in one go, so drag-to-reorder is atomic. */
    @Transactional
    public List<HeroImageDTO> reorder(List<Long> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new BadRequestException("No ordering was provided");
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            HeroImage img = repo.findById(id)
                    .orElseThrow(() -> ResourceNotFoundException.of("Hero image", id));
            img.setDisplayOrder(i);
            repo.save(img);
        }
        return getAll();
    }

    public void delete(Long id) {
        HeroImage img = repo.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Hero image", id));
        fileStorage.deleteQuietly(img.getImageUrl());
        repo.delete(img);
    }

    /**
     * Next free slot. Using the highest existing order rather than the row count
     * avoids the collisions the previous "count + index" scheme produced once
     * anything had been deleted.
     */
    private int nextDisplayOrder() {
        return repo.findAllByOrderByDisplayOrderAsc().stream()
                .map(HeroImage::getDisplayOrder)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .map(max -> max + 1)
                .orElse(0);
    }

    private HeroImageDTO toDTO(HeroImage h) {
        HeroImageDTO dto = new HeroImageDTO();
        dto.setId(h.getId());
        dto.setImageUrl(h.getImageUrl());
        dto.setDisplayOrder(h.getDisplayOrder());
        dto.setActive(h.getActive());
        return dto;
    }
}
