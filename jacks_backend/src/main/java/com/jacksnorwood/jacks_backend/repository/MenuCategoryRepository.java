package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findAllByOrderByDisplayOrderAsc();
}
