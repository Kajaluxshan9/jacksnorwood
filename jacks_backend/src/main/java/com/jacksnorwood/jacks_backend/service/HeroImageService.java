package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.HeroImageDTO;
import com.jacksnorwood.jacks_backend.entity.HeroImage;
import com.jacksnorwood.jacks_backend.repository.HeroImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeroImageService {

    private final HeroImageRepository repo;

    public List<HeroImageDTO> getActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<HeroImageDTO> getAll() {
        return repo.findAllByOrderByDisplayOrderAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public HeroImageDTO create(HeroImageDTO dto) {
        HeroImage img = HeroImage.builder()
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        return toDTO(repo.save(img));
    }

    public void delete(Long id) {
        repo.deleteById(id);
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
