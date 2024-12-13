package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.dto.AuthorDTO;
import com.adityachandel.booklore.entity.Author;

public class AuthorTransformer {

    public static AuthorDTO toAuthorDTO(Author author) {
        return AuthorDTO.builder()
                .name(author.getName())
                .id(author.getId())
                .build();
    }
}
