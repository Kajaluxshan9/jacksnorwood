package com.jacksnorwood.jacks_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * "Turn this whole category into a subcategory under another menu."
 *
 * The admin panel used to do this as three or more separate HTTP calls
 * (create subcategory, update every item, delete the old category). A failure
 * partway through left the menu half-migrated with no way to retry cleanly, so
 * the whole operation now happens in one transactional request instead.
 */
@Data
public class ConvertCategoryRequest {

    /** The category that will become a subcategory. */
    @NotNull(message = "A source category is required")
    private Long sourceCategoryId;

    /** The category it should be nested under. */
    @NotNull(message = "A target category is required")
    private Long targetCategoryId;

    /** Name for the new subcategory; defaults to the source category's name. */
    private String name;
}
