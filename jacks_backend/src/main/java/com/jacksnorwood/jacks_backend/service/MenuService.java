package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ItemSizeDTO;
import com.jacksnorwood.jacks_backend.dto.MenuCategoryDTO;
import com.jacksnorwood.jacks_backend.dto.MenuItemDTO;
import com.jacksnorwood.jacks_backend.dto.ConvertCategoryRequest;
import com.jacksnorwood.jacks_backend.dto.MenuSubcategoryDTO;
import com.jacksnorwood.jacks_backend.entity.*;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
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
    private final FileStorageService fileStorage;

    // ── Categories ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MenuCategoryDTO> getAllCategories() {
        // Fetch-joins the items so mapping them below does not trigger a query
        // per category.
        return menuCategoryRepository.findAllWithItems()
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
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));
        if (dto.getName() != null)        cat.setName(dto.getName());
        if (dto.getDescription() != null) cat.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null)    cat.setImageUrl(dto.getImageUrl());
        if (dto.getDisplayOrder() != null) cat.setDisplayOrder(dto.getDisplayOrder());
        return toCategoryDTO(menuCategoryRepository.save(cat));
    }

    @Transactional
    public void deleteCategory(Long id) {
        MenuCategory category = menuCategoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));

        // Order matters throughout: every foreign key pointing at a row must be
        // cleared before that row is deleted.

        // 1. The category's own items, and their images.
        List<MenuItem> items = menuItemRepository.findByCategoryId(id);
        items.forEach(item -> {
            fileStorage.deleteQuietly(item.getImageUrl());
            item.setSubcategory(null);
            item.setCategory(null);
        });
        menuItemRepository.saveAll(items);
        menuItemRepository.flush();
        menuItemRepository.deleteAll(items);
        menuItemRepository.flush();

        // 2. Any subcategories, plus items filed under them that live in a
        //    different category and must therefore survive.
        List<MenuSubcategory> subs = menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(id);
        if (!subs.isEmpty()) {
            List<Long> subIds = subs.stream().map(MenuSubcategory::getId).collect(Collectors.toList());
            List<MenuItem> stillReferencing = menuItemRepository.findBySubcategoryIdIn(subIds);
            stillReferencing.forEach(i -> i.setSubcategory(null));
            menuItemRepository.saveAll(stillReferencing);
            menuItemRepository.flush();

            subs.forEach(s -> s.setCategory(null));
            menuSubcategoryRepository.saveAll(subs);
            menuSubcategoryRepository.deleteAll(subs);
            menuSubcategoryRepository.flush();
        }

        // 3. The category itself.
        fileStorage.deleteQuietly(category.getImageUrl());
        menuCategoryRepository.delete(category);
    }

    // ── Subcategories ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MenuSubcategoryDTO> getAllSubcategories() {
        return menuSubcategoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toSubcategoryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
                .orElseThrow(() -> ResourceNotFoundException.of("Subcategory", id));
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
        MenuSubcategory sub = menuSubcategoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Subcategory", id));

        // Null out the FK on referencing items so the delete cannot violate it.
        List<MenuItem> referencing = menuItemRepository.findBySubcategoryId(id);
        referencing.forEach(i -> i.setSubcategory(null));
        menuItemRepository.saveAll(referencing);
        menuItemRepository.flush();

        fileStorage.deleteQuietly(sub.getImageUrl());
        menuSubcategoryRepository.delete(sub);
    }

    /**
     * Converts a whole category into a subcategory of another category, moving
     * its items across and removing the now-empty original.
     *
     * Done server-side and transactionally: the admin panel previously issued a
     * create, then one update per item, then a delete. Any failure in the middle
     * left items stranded between two categories with the source already
     * partially emptied, and there was no safe way to re-run it.
     */
    @Transactional
    public MenuSubcategoryDTO convertCategoryToSubcategory(ConvertCategoryRequest request) {
        Long sourceId = request.getSourceCategoryId();
        Long targetId = request.getTargetCategoryId();

        if (sourceId.equals(targetId)) {
            throw new BadRequestException("Choose a different category to nest this one under");
        }

        MenuCategory source = menuCategoryRepository.findById(sourceId)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", sourceId));
        MenuCategory target = menuCategoryRepository.findById(targetId)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", targetId));

        String name = (request.getName() != null && !request.getName().isBlank())
                ? request.getName().trim()
                : source.getName();

        MenuSubcategory created = menuSubcategoryRepository.save(MenuSubcategory.builder()
                .name(name)
                .imageUrl(source.getImageUrl())
                .displayOrder(source.getDisplayOrder())
                .category(target)
                .build());

        // Move every item (active or not) into the new subcategory.
        List<MenuItem> items = menuItemRepository.findByCategoryId(sourceId);
        items.forEach(item -> {
            item.setCategory(target);
            item.setSubcategory(created);
        });
        menuItemRepository.saveAll(items);
        menuItemRepository.flush();

        // Detach and remove the source category's own subcategories, then the
        // category itself. Items have already been moved off it, so nothing is
        // cascade-deleted here.
        List<MenuSubcategory> oldSubs =
                menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(sourceId);
        if (!oldSubs.isEmpty()) {
            oldSubs.forEach(s -> s.setCategory(null));
            menuSubcategoryRepository.saveAll(oldSubs);
            menuSubcategoryRepository.deleteAll(oldSubs);
            menuSubcategoryRepository.flush();
        }

        menuCategoryRepository.delete(source);

        return toSubcategoryDTO(created);
    }

    // ── Items ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllItems() {
        return menuItemRepository.findByIsActiveTrue()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllItemsAdmin() {
        return menuItemRepository.findAll()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getPopularItems() {
        return menuItemRepository.findByIsPopularTrueAndIsActiveTrue()
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getItemsByCategory(Long categoryId) {
        return menuItemRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Transactional
    public MenuItemDTO createItem(MenuItemDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Item name is required");
        }
        if (dto.getCategoryId() == null) {
            throw new BadRequestException("A category must be selected");
        }
        // The admin form labels price as optional ("leave 0 if using sizes"), so
        // treat a missing price as zero rather than failing on the NOT NULL column.
        if (dto.getPrice() == null) {
            dto.setPrice(java.math.BigDecimal.ZERO);
        }
        if (dto.getPrice().signum() < 0) {
            throw new BadRequestException("Price cannot be negative");
        }
        MenuCategory category = menuCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> ResourceNotFoundException.of("Category", dto.getCategoryId()));
        MenuSubcategory subcategory = null;
        if (dto.getSubcategoryId() != null) {
            subcategory = menuSubcategoryRepository.findById(dto.getSubcategoryId()).orElse(null);
        }

        MenuItem item = MenuItem.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
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
                .orElseThrow(() -> ResourceNotFoundException.of("Menu item", id));
        if (dto.getCategoryId() != null) {
            MenuCategory cat = menuCategoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Category", dto.getCategoryId()));
            item.setCategory(cat);
        }
        // Only touch the subcategory when the caller actually addressed it.
        // Clearing it on every payload that omitted the field meant a partial
        // update silently detached the item from its subcategory.
        if (dto.getSubcategoryId() != null) {
            MenuSubcategory sub = menuSubcategoryRepository.findById(dto.getSubcategoryId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Subcategory", dto.getSubcategoryId()));
            item.setSubcategory(sub);
        } else if (dto.isSubcategoryCleared()) {
            item.setSubcategory(null);
        }
        if (dto.getImageUrl() != null) {
            String previous = item.getImageUrl();
            String next = dto.getImageUrl().isBlank() ? null : dto.getImageUrl();
            if (previous != null && !previous.equals(next)) {
                fileStorage.deleteQuietly(previous);
            }
            item.setImageUrl(next);
        }
        if (dto.getName() != null)        item.setName(dto.getName());
        if (dto.getDescription() != null) item.setDescription(dto.getDescription());
        if (dto.getPrice() != null) {
            if (dto.getPrice().signum() < 0) throw new BadRequestException("Price cannot be negative");
            item.setPrice(dto.getPrice());
        }
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

    @Transactional
    public void deleteItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Menu item", id));
        fileStorage.deleteQuietly(item.getImageUrl());
        menuItemRepository.delete(item);
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────────

    public MenuItemDTO toItemDTO(MenuItem item) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setImageUrl(item.getImageUrl());
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
