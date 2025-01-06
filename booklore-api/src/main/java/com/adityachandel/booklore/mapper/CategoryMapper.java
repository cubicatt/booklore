package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Category;
import com.adityachandel.booklore.model.entity.CategoryEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    Category toCategory(CategoryEntity entity);

    List<Category> toCategoryList(List<CategoryEntity> entities);

}
