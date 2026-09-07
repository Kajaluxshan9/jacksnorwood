package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.dto.ConvertCategoryRequest;
import com.jacksnorwood.jacks_backend.dto.MenuSubcategoryDTO;
import com.jacksnorwood.jacks_backend.entity.MenuCategory;
import com.jacksnorwood.jacks_backend.entity.MenuItem;
import com.jacksnorwood.jacks_backend.entity.MenuSubcategory;
import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import com.jacksnorwood.jacks_backend.repository.MenuCategoryRepository;
import com.jacksnorwood.jacks_backend.repository.MenuItemRepository;
import com.jacksnorwood.jacks_backend.repository.MenuSubcategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The destructive menu operations, run against a real database.
 *
 * These two are the ones worth exercising for real rather than with mocks:
 * deleting a category used to fail outright on a foreign key, and converting a
 * category was a multi-request client-side flow that could half-succeed.
 */
@SpringBootTest
@Transactional
class MenuServiceIntegrationTest {

    @Autowired private MenuService menuService;
    @Autowired private MenuCategoryRepository categoryRepository;
    @Autowired private MenuSubcategoryRepository subcategoryRepository;
    @Autowired private MenuItemRepository itemRepository;

    private MenuCategory source;
    private MenuCategory target;
    private MenuSubcategory sourceSub;

    @BeforeEach
    void seed() {
        itemRepository.deleteAll();
        subcategoryRepository.deleteAll();
        categoryRepository.deleteAll();

        source = categoryRepository.save(MenuCategory.builder().name("Burgers").displayOrder(1).build());
        target = categoryRepository.save(MenuCategory.builder().name("Main Menu").displayOrder(2).build());
        sourceSub = subcategoryRepository.save(
                MenuSubcategory.builder().name("Beef").category(source).build());

        itemRepository.save(MenuItem.builder()
                .name("Cheeseburger").price(new BigDecimal("14.00"))
                .category(source).subcategory(sourceSub).build());
        itemRepository.save(MenuItem.builder()
                .name("Veggie Burger").price(new BigDecimal("13.00"))
                .category(source).build());
    }

    // ── Deleting a category ──────────────────────────────────────────────────

    @Test
    @DisplayName("deleting a category with subcategories that have items succeeds")
    void deleteCategoryWithPopulatedSubcategories() {
        // This is the exact shape that used to raise a foreign key violation:
        // the subcategory rows were deleted while items still referenced them.
        menuService.deleteCategory(source.getId());

        assertThat(categoryRepository.findById(source.getId())).isEmpty();
        assertThat(subcategoryRepository.findById(sourceSub.getId())).isEmpty();
        assertThat(itemRepository.findAll())
                .as("the category's items go with it")
                .isEmpty();
        assertThat(categoryRepository.findById(target.getId()))
                .as("other categories are untouched")
                .isPresent();
    }

    @Test
    @DisplayName("deleting a subcategory keeps its items, just unfiled")
    void deleteSubcategoryKeepsItems() {
        menuService.deleteSubcategory(sourceSub.getId());

        assertThat(subcategoryRepository.findById(sourceSub.getId())).isEmpty();
        assertThat(itemRepository.findAll())
                .hasSize(2)
                .allSatisfy(i -> assertThat(i.getSubcategory()).isNull());
    }

    // ── Converting a category ────────────────────────────────────────────────

    @Test
    @DisplayName("converting a category moves every item and removes the original")
    void convertCategoryMovesEverything() {
        ConvertCategoryRequest request = new ConvertCategoryRequest();
        request.setSourceCategoryId(source.getId());
        request.setTargetCategoryId(target.getId());
        request.setName("Burgers");

        MenuSubcategoryDTO created = menuService.convertCategoryToSubcategory(request);

        assertThat(created.getName()).isEqualTo("Burgers");
        assertThat(created.getCategoryId()).isEqualTo(target.getId());

        // Every item now sits under the target category, in the new subcategory.
        assertThat(itemRepository.findAll())
                .hasSize(2)
                .allSatisfy(i -> {
                    assertThat(i.getCategory().getId()).isEqualTo(target.getId());
                    assertThat(i.getSubcategory().getId()).isEqualTo(created.getId());
                });

        assertThat(categoryRepository.findById(source.getId()))
                .as("the emptied source category is removed")
                .isEmpty();
        assertThat(subcategoryRepository.findById(sourceSub.getId()))
                .as("its old subcategories go too")
                .isEmpty();
    }

    @Test
    @DisplayName("converting defaults the subcategory name to the source category name")
    void convertDefaultsName() {
        ConvertCategoryRequest request = new ConvertCategoryRequest();
        request.setSourceCategoryId(source.getId());
        request.setTargetCategoryId(target.getId());
        request.setName("   ");

        assertThat(menuService.convertCategoryToSubcategory(request).getName()).isEqualTo("Burgers");
    }

    @Test
    @DisplayName("converting a category into itself is rejected")
    void convertRejectsSameCategory() {
        ConvertCategoryRequest request = new ConvertCategoryRequest();
        request.setSourceCategoryId(source.getId());
        request.setTargetCategoryId(source.getId());

        assertThatThrownBy(() -> menuService.convertCategoryToSubcategory(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("different category");

        assertThat(categoryRepository.findById(source.getId()))
                .as("nothing is destroyed when the request is rejected")
                .isPresent();
    }

    @Test
    @DisplayName("public listings exclude inactive items but admin listings include them")
    void activeVisibility() {
        itemRepository.save(MenuItem.builder()
                .name("Seasonal Burger").price(BigDecimal.TEN)
                .category(source).isActive(false).build());

        assertThat(menuService.getAllItems()).extracting("name")
                .doesNotContain("Seasonal Burger");
        assertThat(menuService.getAllItemsAdmin()).extracting("name")
                .contains("Seasonal Burger");
        assertThat(menuService.getItemsByCategory(source.getId())).extracting("name")
                .doesNotContain("Seasonal Burger");
    }
}
