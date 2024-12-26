package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.ShelfDTO;
import com.adityachandel.booklore.model.entity.Shelf;

public class ShelfTransformer {

    public static ShelfDTO convertToShelfDTO(Shelf shelf) {
        return ShelfDTO.builder()
                .id(shelf.getId())
                .name(shelf.getName())
                .sort(shelf.getSort())
                .build();
    }
}
