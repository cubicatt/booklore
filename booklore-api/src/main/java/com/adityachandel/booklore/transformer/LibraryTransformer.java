package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.LibraryDTO;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.Library;

public class LibraryTransformer {

    public static LibraryDTO convertToLibraryDTO(Library library) {
        return LibraryDTO.builder()
                .id(library.getId())
                .name(library.getName())
                .paths(library.getPaths())
                .build();
    }
}
