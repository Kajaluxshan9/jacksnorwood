package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.GalleryDTO;
import com.jacksnorwood.jacks_backend.entity.Gallery;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.GalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final FileStorageService fileStorage;

    public List<GalleryDTO> getAll() {
        return galleryRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<GalleryDTO> getByCategory(String category) {
        return galleryRepository.findByCategoryIgnoreCaseOrderByDisplayOrderAscIdAsc(normalise(category))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public GalleryDTO create(GalleryDTO dto) {
        if (dto.getImageUrl() == null || dto.getImageUrl().isBlank()) {
            throw new BadRequestException("An image is required");
        }
        Gallery g = Gallery.builder()
                .imageUrl(dto.getImageUrl())
                .category(normalise(dto.getCategory()))
                .caption(dto.getCaption())
                // Default rather than leave null: a null display order sorts
                // unpredictably and made the gallery order effectively random.
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : nextDisplayOrder())
                .build();
        return toDTO(galleryRepository.save(g));
    }

    /** Edit caption, category or position after upload — previously impossible. */
    public GalleryDTO update(Long id, GalleryDTO dto) {
        Gallery g = galleryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Gallery image", id));
        if (dto.getCategory() != null)     g.setCategory(normalise(dto.getCategory()));
        if (dto.getCaption() != null)      g.setCaption(dto.getCaption());
        if (dto.getDisplayOrder() != null) g.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()
                && !dto.getImageUrl().equals(g.getImageUrl())) {
            fileStorage.deleteQuietly(g.getImageUrl());
            g.setImageUrl(dto.getImageUrl());
        }
        return toDTO(galleryRepository.save(g));
    }

    public void delete(Long id) {
        Gallery g = galleryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Gallery image", id));
        fileStorage.deleteQuietly(g.getImageUrl());
        galleryRepository.delete(g);
    }

    private int nextDisplayOrder() {
        return galleryRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(Gallery::getDisplayOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .map(max -> max + 1)
                .orElse(0);
    }

    /** Categories are matched by value on the public page, so store them consistently. */
    private String normalise(String category) {
        return category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
    }

    private GalleryDTO toDTO(Gallery g) {
        GalleryDTO dto = new GalleryDTO();
        dto.setId(g.getId()); dto.setImageUrl(g.getImageUrl()); dto.setCategory(g.getCategory());
        dto.setCaption(g.getCaption()); dto.setDisplayOrder(g.getDisplayOrder());
        return dto;
    }
}
