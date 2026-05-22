package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Gallery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {
    List<Gallery> findByCategory(String category);
    List<Gallery> findAllByOrderByDisplayOrderAsc();
}
