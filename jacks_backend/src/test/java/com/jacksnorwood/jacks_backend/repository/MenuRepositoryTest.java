package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.MenuCategory;
import com.jacksnorwood.jacks_backend.entity.MenuItem;
import com.jacksnorwood.jacks_backend.entity.MenuSubcategory;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the queries against a real (in-memory) database, where the things
 * that actually bite - duplicate rows from a fetch join, null ordering, and
 * N+1 query counts - are observable.
 */
@DataJpaTest
// Keep the datasource configured in src/test/resources/application.properties:
// its NON_KEYWORDS=KEY,VALUE is required for the site_settings table, whose
// columns are literally named "key" and "value".
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class MenuRepositoryTest {

    @Autowired private MenuCategoryRepository categoryRepository;
    @Autowired private MenuSubcategoryRepository subcategoryRepository;
    @Autowired private MenuItemRepository itemRepository;
    @Autowired private EntityManager em;

    private MenuCategory mains;
    private MenuCategory drinks;

    @BeforeEach
    void seed() {
        mains = categoryRepository.save(
                MenuCategory.builder().name("Mains").displayOrder(1).build());
        drinks = categoryRepository.save(
                MenuCategory.builder().name("Drinks").displayOrder(2).build());
        // No display order - must sort last, not first.
        categoryRepository.save(MenuCategory.builder().name("Unsorted").build());

        for (int i = 1; i <= 3; i++) {
            itemRepository.save(MenuItem.builder()
                    .name("Main " + i).price(new BigDecimal("9.99")).category(mains).build());
        }
        itemRepository.save(MenuItem.builder()
                .name("Pint").price(new BigDecimal("7.50")).category(drinks).build());

        em.flush();
        em.clear();
    }

    private Statistics stats() {
        return em.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
    }

    @Test
    @DisplayName("findAllWithItems returns each category exactly once")
    void fetchJoinDoesNotDuplicateCategories() {
        List<MenuCategory> result = categoryRepository.findAllWithItems();

        // A left join fetch multiplies the parent row once per child, so without
        // `distinct` "Mains" would come back three times.
        assertThat(result).extracting(MenuCategory::getName)
                .containsExactly("Mains", "Drinks", "Unsorted");
    }

    @Test
    @DisplayName("findAllWithItems loads the items eagerly, in one query")
    void fetchJoinAvoidsNPlusOne() {
        stats().clear();

        List<MenuCategory> result = categoryRepository.findAllWithItems();
        // Touch every collection - this is what the DTO mapping does.
        long total = result.stream().mapToLong(c -> c.getItems() == null ? 0 : c.getItems().size()).sum();

        assertThat(total).isEqualTo(4);
        assertThat(result).allSatisfy(c ->
                assertThat(Hibernate.isInitialized(c.getItems()))
                        .as("%s items must already be loaded", c.getName())
                        .isTrue());
        // One query for categories+items, plus one batched query for the item
        // sizes. The point is that this stays constant: before the fetch join
        // and @BatchSize it grew with the number of categories and items.
        assertThat(stats().getPrepareStatementCount())
                .as("query count must not scale with the number of categories/items")
                .isLessThanOrEqualTo(2);
    }

    @Test
    @DisplayName("categories without a display order sort last")
    void nullDisplayOrderSortsLast() {
        assertThat(categoryRepository.findAllWithItems())
                .extracting(MenuCategory::getName)
                .last().isEqualTo("Unsorted");
    }

    @Test
    @DisplayName("findBySubcategoryIdIn finds exactly the referencing items")
    void findsItemsBySubcategory() {
        MenuSubcategory burgers = subcategoryRepository.save(
                MenuSubcategory.builder().name("Burgers").category(mains).build());
        MenuSubcategory steaks = subcategoryRepository.save(
                MenuSubcategory.builder().name("Steaks").category(mains).build());

        itemRepository.save(MenuItem.builder()
                .name("Cheeseburger").price(BigDecimal.TEN).category(mains).subcategory(burgers).build());
        itemRepository.save(MenuItem.builder()
                .name("Ribeye").price(BigDecimal.TEN).category(mains).subcategory(steaks).build());
        em.flush();
        em.clear();

        assertThat(itemRepository.findBySubcategoryId(burgers.getId()))
                .extracting(MenuItem::getName).containsExactly("Cheeseburger");

        assertThat(itemRepository.findBySubcategoryIdIn(List.of(burgers.getId(), steaks.getId())))
                .extracting(MenuItem::getName)
                .containsExactlyInAnyOrder("Cheeseburger", "Ribeye");
    }

    @Test
    @DisplayName("only active items are returned to the public menu")
    void activeFilter() {
        itemRepository.save(MenuItem.builder()
                .name("Hidden").price(BigDecimal.ONE).category(mains).isActive(false).build());
        em.flush();
        em.clear();

        assertThat(itemRepository.findByIsActiveTrue())
                .extracting(MenuItem::getName)
                .doesNotContain("Hidden")
                .hasSize(4);
    }
}
