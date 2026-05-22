package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.GalleryDTO;
import com.jacksnorwood.jacks_backend.entity.Gallery;
import com.jacksnorwood.jacks_backend.repository.GalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryRepository galleryRepository;

    public List<GalleryDTO> getAll() {
        return galleryRepository.findAllByOrderByDisplayOrderAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<GalleryDTO> getByCategory(String category) {
        return galleryRepository.findByCategory(category).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public GalleryDTO create(GalleryDTO dto) {
        Gallery g = Gallery.builder()
                .imageUrl(dto.getImageUrl()).category(dto.getCategory())
                .caption(dto.getCaption()).displayOrder(dto.getDisplayOrder()).build();
        return toDTO(galleryRepository.save(g));
    }

    public void delete(Long id) { galleryRepository.deleteById(id); }

    private GalleryDTO toDTO(Gallery g) {
        GalleryDTO dto = new GalleryDTO();
        dto.setId(g.getId()); dto.setImageUrl(g.getImageUrl()); dto.setCategory(g.getCategory());
        dto.setCaption(g.getCaption()); dto.setDisplayOrder(g.getDisplayOrder());
        return dto;
    }
}
