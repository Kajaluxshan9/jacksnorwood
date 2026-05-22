package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.HeroImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HeroImageRepository extends JpaRepository<HeroImage, Long> {
    List<HeroImage> findByActiveTrueOrderByDisplayOrderAsc();
    List<HeroImage> findAllByOrderByDisplayOrderAsc();
}
