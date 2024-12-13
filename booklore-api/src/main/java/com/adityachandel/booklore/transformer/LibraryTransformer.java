package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.dto.LibraryDTO;
import com.adityachandel.booklore.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.entity.Library;

public class LibraryTransformer {

    public static LibraryDTO convertToLibraryDTO(Library library) {
        return LibraryDTO.builder()
                .id(library.getId())
                .name(library.getName())
                .build();
    }

    public static Library createLibraryFromRequest(CreateLibraryRequest request) {
        return Library.builder()
                .name(request.getName())
                .paths(request.getPaths())
                .build();
    }
}
