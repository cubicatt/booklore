package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.AuthorDTO;
import com.adityachandel.booklore.model.entity.Author;

public class AuthorTransformer {

    public static AuthorDTO toAuthorDTO(Author author) {
        return AuthorDTO.builder()
                .name(author.getName())
                .id(author.getId())
                .build();
    }
}
