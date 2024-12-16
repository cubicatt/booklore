package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.CategoryDTO;
import com.adityachandel.booklore.model.entity.Category;

public class CategoryTransformer {

    public static CategoryDTO categoryDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}
