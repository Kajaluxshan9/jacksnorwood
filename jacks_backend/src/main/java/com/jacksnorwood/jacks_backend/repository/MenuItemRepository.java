package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategoryId(Long categoryId);
    List<MenuItem> findByIsPopularTrueAndIsActiveTrue();
    List<MenuItem> findByIsActiveTrue();
    List<MenuItem> findByCategoryIdAndIsActiveTrue(Long categoryId);
}
