package com.jacksnorwood.jacks_backend.repository;

import com.jacksnorwood.jacks_backend.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    List<MenuCategory> findAllByOrderByDisplayOrderAsc();

    /**
     * Categories with their items already loaded.
     *
     * The public menu listing maps every category's items, which with a plain
     * findAll issued one extra query per category (an N+1). `distinct` is
     * required because the join multiplies the category row once per item.
     *
     * `nulls last` (rather than a CASE expression) is deliberate: under SELECT
     * DISTINCT, PostgreSQL requires every ORDER BY expression to appear in the
     * select list, so ordering by a computed expression fails there even though
     * H2 accepts it. It also makes null ordering explicit rather than relying on
     * each database's default, which differs between the two.
     */
    @Query("select distinct c from MenuCategory c "
         + "left join fetch c.items "
         + "order by c.displayOrder asc nulls last, c.id asc")
    List<MenuCategory> findAllWithItems();
}
