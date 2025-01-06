package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ShelfMapper {

    Shelf toShelf(ShelfEntity shelfEntity);
}
