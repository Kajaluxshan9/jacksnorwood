package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.MenuItemDTO;
import com.jacksnorwood.jacks_backend.entity.MenuCategory;
import com.jacksnorwood.jacks_backend.entity.MenuItem;
import com.jacksnorwood.jacks_backend.entity.MenuSubcategory;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.exception.ResourceNotFoundException;
import com.jacksnorwood.jacks_backend.repository.MenuCategoryRepository;
import com.jacksnorwood.jacks_backend.repository.MenuItemRepository;
import com.jacksnorwood.jacks_backend.repository.MenuSubcategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MenuServiceTest {

    @Mock private MenuItemRepository menuItemRepository;
    @Mock private MenuCategoryRepository menuCategoryRepository;
    @Mock private MenuSubcategoryRepository menuSubcategoryRepository;
    @Mock private FileStorageService fileStorage;

    @InjectMocks private MenuService menuService;

    private MenuCategory category(long id) {
        MenuCategory c = new MenuCategory();
        c.setId(id);
        c.setName("Category " + id);
        return c;
    }

    private MenuSubcategory subcategory(long id, MenuCategory parent) {
        MenuSubcategory s = new MenuSubcategory();
        s.setId(id);
        s.setName("Sub " + id);
        s.setCategory(parent);
        return s;
    }

    private MenuItem item(long id, MenuCategory cat, MenuSubcategory sub) {
        MenuItem i = MenuItem.builder()
                .name("Item " + id).price(BigDecimal.ONE).category(cat).subcategory(sub).build();
        i.setId(id);
        return i;
    }

    // ── The FK-violation regression ──────────────────────────────────────────

    @Test
    @DisplayName("deleting a category clears item FKs and flushes BEFORE deleting subcategories")
    void deleteCategoryClearsItemFksFirst() {
        MenuCategory cat = category(1);
        MenuSubcategory sub = subcategory(10, cat);
        MenuItem referencing = item(100, cat, sub);

        when(menuCategoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(sub));
        when(menuItemRepository.findBySubcategoryIdIn(List.of(10L)))
                .thenReturn(List.of(referencing));
        when(menuItemRepository.findByCategoryId(1L)).thenReturn(List.of(referencing));

        menuService.deleteCategory(1L);

        // The item must be detached from the subcategory...
        assertThat(referencing.getSubcategory())
                .as("item FK must be nulled before its subcategory row is removed")
                .isNull();

        // ...and that must be flushed before the subcategory delete is issued,
        // otherwise the database rejects the delete on the foreign key.
        InOrder order = inOrder(menuItemRepository, menuSubcategoryRepository, menuCategoryRepository);
        order.verify(menuItemRepository).saveAll(anyList());
        order.verify(menuItemRepository).flush();
        order.verify(menuSubcategoryRepository).deleteAll(anyList());
        order.verify(menuCategoryRepository).delete(cat);
    }

    @Test
    @DisplayName("deleting a category removes the images of the items it cascades away")
    void deleteCategoryCleansUpImages() {
        MenuCategory cat = category(1);
        cat.setImageUrl("/uploads/cat.jpg");
        MenuItem withImage = item(100, cat, null);
        withImage.setImageUrl("/uploads/item.jpg");

        when(menuCategoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
        when(menuItemRepository.findByCategoryId(1L)).thenReturn(List.of(withImage));

        menuService.deleteCategory(1L);

        verify(fileStorage).deleteQuietly("/uploads/item.jpg");
        verify(fileStorage).deleteQuietly("/uploads/cat.jpg");
    }

    @Test
    @DisplayName("deleting a category with no subcategories skips the FK dance entirely")
    void deleteCategoryWithoutSubcategories() {
        MenuCategory cat = category(1);
        when(menuCategoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(menuSubcategoryRepository.findByCategoryIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
        when(menuItemRepository.findByCategoryId(1L)).thenReturn(List.of());

        menuService.deleteCategory(1L);

        verify(menuSubcategoryRepository, never()).deleteAll(anyList());
        verify(menuCategoryRepository).delete(cat);
    }

    @Test
    @DisplayName("deleting a missing category is a 404, not a 500")
    void deleteMissingCategory() {
        when(menuCategoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.deleteCategory(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleting a subcategory detaches its items rather than scanning every menu item")
    void deleteSubcategoryUsesTargetedQuery() {
        MenuCategory cat = category(1);
        MenuSubcategory sub = subcategory(10, cat);
        MenuItem referencing = item(100, cat, sub);

        when(menuSubcategoryRepository.findById(10L)).thenReturn(Optional.of(sub));
        when(menuItemRepository.findBySubcategoryId(10L)).thenReturn(List.of(referencing));

        menuService.deleteSubcategory(10L);

        assertThat(referencing.getSubcategory()).isNull();
        verify(menuItemRepository, never()).findAll();
        verify(menuItemRepository).flush();
        verify(menuSubcategoryRepository).delete(sub);
    }

    // ── Create/update rules ──────────────────────────────────────────────────

    @Test
    @DisplayName("a missing price is stored as zero, not rejected")
    void missingPriceDefaultsToZero() {
        MenuCategory cat = category(1);
        when(menuCategoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItemDTO dto = new MenuItemDTO();
        dto.setName("Sized only");
        dto.setCategoryId(1L);

        MenuItemDTO saved = menuService.createItem(dto);

        assertThat(saved.getPrice()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("a negative price is rejected")
    void negativePriceRejected() {
        MenuCategory cat = category(1);
        when(menuCategoryRepository.findById(1L)).thenReturn(Optional.of(cat));

        MenuItemDTO dto = new MenuItemDTO();
        dto.setName("Bad");
        dto.setCategoryId(1L);
        dto.setPrice(new BigDecimal("-1"));

        assertThatThrownBy(() -> menuService.createItem(dto))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("negative");
    }

    @Test
    @DisplayName("creating an item without a name or category is rejected")
    void createRequiresNameAndCategory() {
        MenuItemDTO noName = new MenuItemDTO();
        noName.setCategoryId(1L);
        assertThatThrownBy(() -> menuService.createItem(noName))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("name");

        MenuItemDTO noCategory = new MenuItemDTO();
        noCategory.setName("Orphan");
        assertThatThrownBy(() -> menuService.createItem(noCategory))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("category");
    }

    @Test
    @DisplayName("a partial update leaves an unmentioned subcategory attached")
    void partialUpdateKeepsSubcategory() {
        MenuCategory cat = category(1);
        MenuSubcategory sub = subcategory(10, cat);
        MenuItem existing = item(100, cat, sub);

        when(menuItemRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItemDTO dto = new MenuItemDTO();
        dto.setName("Renamed");   // subcategoryId never touched

        menuService.updateItem(100L, dto);

        assertThat(existing.getSubcategory()).as("must not be detached").isEqualTo(sub);
        assertThat(existing.getName()).isEqualTo("Renamed");
    }

    @Test
    @DisplayName("an explicitly-null subcategory detaches the item")
    void explicitNullSubcategoryDetaches() {
        MenuCategory cat = category(1);
        MenuItem existing = item(100, cat, subcategory(10, cat));

        when(menuItemRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItemDTO dto = new MenuItemDTO();
        dto.setSubcategoryId(null);   // setter marks the field as present

        menuService.updateItem(100L, dto);

        assertThat(existing.getSubcategory()).isNull();
    }

    @Test
    @DisplayName("replacing an item's image deletes the file it replaced")
    void replacingImageCleansUpTheOldFile() {
        MenuCategory cat = category(1);
        MenuItem existing = item(100, cat, null);
        existing.setImageUrl("/uploads/old.jpg");

        when(menuItemRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItemDTO dto = new MenuItemDTO();
        dto.setImageUrl("/uploads/new.jpg");

        menuService.updateItem(100L, dto);

        verify(fileStorage).deleteQuietly("/uploads/old.jpg");
        assertThat(existing.getImageUrl()).isEqualTo("/uploads/new.jpg");
    }
}
