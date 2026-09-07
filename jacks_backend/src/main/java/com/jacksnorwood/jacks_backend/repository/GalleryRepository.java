package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.Gallery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {
    // Ordered, and case-insensitive so categories typed with different casing
    // in the admin panel still group together on the public page.
    List<Gallery> findByCategoryIgnoreCaseOrderByDisplayOrderAscIdAsc(String category);
    List<Gallery> findAllByOrderByDisplayOrderAscIdAsc();
}
