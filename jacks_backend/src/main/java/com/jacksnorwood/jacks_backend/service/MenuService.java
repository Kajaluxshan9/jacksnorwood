package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ItemSizeDTO;
import com.jacksnorwood.jacks_backend.dto.MenuCategoryDTO;
import com.jacksnorwood.jacks_backend.dto.MenuItemDTO;
import com.jacksnorwood.jacks_backend.dto.MenuSubcategoryDTO;
import com.jacksnorwood.jacks_backend.entity.*;
import com.jacksnorwood.jacks_backend.repository.MenuCategoryRepository;
import com.jacksnorwood.jacks_backend.repository.MenuItemRepository;
import com.jacksnorwood.jacks_backend.repository.MenuSubcategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final MenuSubcategoryRepository menuSubcategoryRepository;

    // ── Categories ──────────────────────────────────────────────────────────────

    public List<MenuCategoryDTO> getAllCategories() {
        return menuCategoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toCategoryDTO).collect(Collectors.toList());
    }

    public MenuCategoryDTO createCategory(MenuCategoryDTO dto) {
        MenuCategory cat = MenuCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder())
                .build();
        return toCategoryDTO(menuCategoryRepository.save(cat));
    }

    public MenuCategoryDTO updateCategory(Long id, MenuCategoryDTO dto) {
        MenuCategory cat = menuCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (dto.getName() != null)        cat.setName(dto.getName());
        if (dto.getDescription() != null) cat.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null)    cat.setImageUrl(dto.getImageUrl());
        if (dto.getDisplayOrder() != null) cat.setDisplayOrder(dto.getDisplayOrder());
        return toCategoryDTO(menuCategoryRepository.save(cat));
    }

    @Transactional
    public void deleteCategory(Long id) {
        // Null out subcategory→category FK to avoid orphaned rows, then delete subcategories
        List<MenuSubcategory> subs = menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(id);
        subs.forEach(s -> s.setCategory(null));
        menuSubcategoryRepository.saveAll(subs);
        menuSubcategoryRepository.deleteAll(subs);
        menuCategoryRepository.deleteById(id);
    }

    // ── Subcategories ────────────────────────────────────────────────────────────

    public List<MenuSubcategoryDTO> getAllSubcategories() {
        return menuSubcategoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toSubcategoryDTO).collect(Collectors.toList());
    }

    public List<MenuSubcategoryDTO> getSubcategoriesByCategoryId(Long categoryId) {
        return menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(categoryId)
                .stream().map(this::toSubcategoryDTO).collect(Collectors.toList());
    }

    public MenuSubcategoryDTO createSubcategory(MenuSubcategoryDTO dto) {
        MenuCategory cat = null;
        if (dto.getCategoryId() != null) {
            cat = menuCategoryRepository.findById(dto.getCategoryId()).orElse(null);
        }
        MenuSubcategory sub = MenuSubcategory.builder()
                .name(dto.getName())
                .imageUrl(dto.getImageUrl())
                .displayOrder(dto.getDisplayOrder())
                .category(cat)
                .build();
        return toSubcategoryDTO(menuSubcategoryRepository.save(sub));
    }

    public MenuSubcategoryDTO updateSubcategory(Long id, MenuSubcategoryDTO dto) {
        MenuSubcategory sub = menuSubcategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subcategory not found"));
        if (dto.getName() != null)        sub.setName(dto.getName());
        if (dto.getImageUrl() != null)    sub.setImageUrl(dto.getImageUrl());
        if (dto.getDisplayOrder() != null) sub.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getCategoryId() != null) {
            menuCategoryRepository.findById(dto.getCategoryId()).ifPresent(sub::setCategory);
        }
        return toSubcategoryDTO(menuSubcategoryRepository.save(sub));
    }

    @Transactional
    public void deleteSubcategory(Long id) {
        // Null out the FK on any items that reference this subcategory to avoid FK violation
        List<MenuItem> referencing = menuItemRepository.findAll().stream()
                .filter(i -> i.getSubcategory() != null && i.getSubcategory().getId().equals(id))
                .collect(Collectors.toList());
        referencing.forEach(i -> i.setSubcategory(null));
        menuItemRepository.saveAll(referencing);
        menuSubcategoryRepository.deleteById(id);
    }

    // ── Items ────────────────────────────────────────────────────────────────────

    public List<MenuItemDTO> getAllItems() {
        return menuItemRepository.findByIsActiveTrue()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    public List<MenuItemDTO> getAllItemsAdmin() {
        return menuItemRepository.findAll()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    public List<MenuItemDTO> getPopularItems() {
        return menuItemRepository.findByIsPopularTrueAndIsActiveTrue()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    public List<MenuItemDTO> getItemsByCategory(Long categoryId) {
        return menuItemRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Transactional
    public MenuItemDTO createItem(MenuItemDTO dto) {
        MenuCategory category = menuCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        MenuSubcategory subcategory = null;
        if (dto.getSubcategoryId() != null) {
            subcategory = menuSubcategoryRepository.findById(dto.getSubcategoryId()).orElse(null);
        }

        MenuItem item = MenuItem.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .category(category)
                .subcategory(subcategory)
                .isPopular(dto.getIsPopular() != null ? dto.getIsPopular() : false)
                .isSpicy(dto.getIsSpicy() != null ? dto.getIsSpicy() : false)
                .isVegan(dto.getIsVegan() != null ? dto.getIsVegan() : false)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        // Sizes
        if (dto.getSizes() != null && !dto.getSizes().isEmpty()) {
            List<ItemSize> sizes = dto.getSizes().stream().map(s -> {
                ItemSize sz = new ItemSize();
                sz.setName(s.getName());
                sz.setPrice(s.getPrice());
                sz.setMenuItem(item);
                return sz;
            }).collect(Collectors.toList());
            item.getSizes().addAll(sizes);
        }

        return toItemDTO(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemDTO updateItem(Long id, MenuItemDTO dto) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (dto.getCategoryId() != null) {
            MenuCategory cat = menuCategoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            item.setCategory(cat);
        }
        if (dto.getSubcategoryId() != null) {
            menuSubcategoryRepository.findById(dto.getSubcategoryId()).ifPresent(item::setSubcategory);
        } else {
            item.setSubcategory(null);
        }
        if (dto.getName() != null)        item.setName(dto.getName());
        if (dto.getDescription() != null) item.setDescription(dto.getDescription());
        if (dto.getPrice() != null)       item.setPrice(dto.getPrice());
        if (dto.getIsPopular() != null)   item.setIsPopular(dto.getIsPopular());
        if (dto.getIsSpicy() != null)     item.setIsSpicy(dto.getIsSpicy());
        if (dto.getIsVegan() != null)     item.setIsVegan(dto.getIsVegan());
        if (dto.getIsActive() != null)    item.setIsActive(dto.getIsActive());

        // Replace sizes
        if (dto.getSizes() != null) {
            item.getSizes().clear();
            dto.getSizes().forEach(s -> {
                ItemSize sz = new ItemSize();
                sz.setName(s.getName());
                sz.setPrice(s.getPrice());
                sz.setMenuItem(item);
                item.getSizes().add(sz);
            });
        }

        return toItemDTO(menuItemRepository.save(item));
    }

    public void deleteItem(Long id) { menuItemRepository.deleteById(id); }

    // ── Mapping helpers ──────────────────────────────────────────────────────────

    public MenuItemDTO toItemDTO(MenuItem item) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setIsPopular(item.getIsPopular());
        dto.setIsSpicy(item.getIsSpicy());
        dto.setIsVegan(item.getIsVegan());
        dto.setIsActive(item.getIsActive());

        if (item.getCategory() != null) {
            dto.setCategoryId(item.getCategory().getId());
            dto.setCategoryName(item.getCategory().getName());
        }
        if (item.getSubcategory() != null) {
            dto.setSubcategoryId(item.getSubcategory().getId());
            dto.setSubcategoryName(item.getSubcategory().getName());
            dto.setSubcategoryImageUrl(item.getSubcategory().getImageUrl());
        }

        if (item.getSizes() != null && !item.getSizes().isEmpty()) {
            dto.setSizes(item.getSizes().stream().map(s -> {
                ItemSizeDTO sd = new ItemSizeDTO();
                sd.setId(s.getId());
                sd.setName(s.getName());
                sd.setPrice(s.getPrice());
                return sd;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    public MenuCategoryDTO toCategoryDTO(MenuCategory cat) {
        MenuCategoryDTO dto = new MenuCategoryDTO();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setImageUrl(cat.getImageUrl());
        dto.setDisplayOrder(cat.getDisplayOrder());
        if (cat.getItems() != null) {
            dto.setItems(cat.getItems().stream()
                    .filter(i -> Boolean.TRUE.equals(i.getIsActive()))
                    .map(this::toItemDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    public MenuSubcategoryDTO toSubcategoryDTO(MenuSubcategory sub) {
        MenuSubcategoryDTO dto = new MenuSubcategoryDTO();
        dto.setId(sub.getId());
        dto.setName(sub.getName());
        dto.setImageUrl(sub.getImageUrl());
        dto.setDisplayOrder(sub.getDisplayOrder());
        if (sub.getCategory() != null) {
            dto.setCategoryId(sub.getCategory().getId());
            dto.setCategoryName(sub.getCategory().getName());
        }
        return dto;
    }
}
