package com.jacksnorwood.jacks_backend.controller;

import com.jacksnorwood.jacks_backend.dto.MenuCategoryDTO;
import com.jacksnorwood.jacks_backend.dto.MenuItemDTO;
import com.jacksnorwood.jacks_backend.dto.MenuSubcategoryDTO;
import com.jacksnorwood.jacks_backend.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    // ── Categories ────────────────────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<MenuCategoryDTO>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<MenuCategoryDTO> createCategory(@RequestBody MenuCategoryDTO dto) {
        return ResponseEntity.ok(menuService.createCategory(dto));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<MenuCategoryDTO> updateCategory(@PathVariable Long id, @RequestBody MenuCategoryDTO dto) {
        return ResponseEntity.ok(menuService.updateCategory(id, dto));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ── Subcategories ─────────────────────────────────────────────────────────

    @GetMapping("/subcategories")
    public ResponseEntity<List<MenuSubcategoryDTO>> getSubcategories() {
        return ResponseEntity.ok(menuService.getAllSubcategories());
    }

    @GetMapping("/subcategories/category/{categoryId}")
    public ResponseEntity<List<MenuSubcategoryDTO>> getSubcategoriesByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(menuService.getSubcategoriesByCategoryId(categoryId));
    }

    @PostMapping("/subcategories")
    public ResponseEntity<MenuSubcategoryDTO> createSubcategory(@RequestBody MenuSubcategoryDTO dto) {
        return ResponseEntity.ok(menuService.createSubcategory(dto));
    }

    @PutMapping("/subcategories/{id}")
    public ResponseEntity<MenuSubcategoryDTO> updateSubcategory(@PathVariable Long id, @RequestBody MenuSubcategoryDTO dto) {
        return ResponseEntity.ok(menuService.updateSubcategory(id, dto));
    }

    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<Void> deleteSubcategory(@PathVariable Long id) {
        menuService.deleteSubcategory(id);
        return ResponseEntity.noContent().build();
    }

    // ── Items ─────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<MenuItemDTO>> getAllItems() {
        return ResponseEntity.ok(menuService.getAllItems());
    }

    @GetMapping("/all")
    public ResponseEntity<List<MenuItemDTO>> getAllItemsAdmin() {
        return ResponseEntity.ok(menuService.getAllItemsAdmin());
    }

    @GetMapping("/popular")
    public ResponseEntity<List<MenuItemDTO>> getPopular() {
        return ResponseEntity.ok(menuService.getPopularItems());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<MenuItemDTO>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(menuService.getItemsByCategory(categoryId));
    }

    @PostMapping
    public ResponseEntity<MenuItemDTO> create(@RequestBody MenuItemDTO dto) {
        return ResponseEntity.ok(menuService.createItem(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemDTO> update(@PathVariable Long id, @RequestBody MenuItemDTO dto) {
        return ResponseEntity.ok(menuService.updateItem(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
