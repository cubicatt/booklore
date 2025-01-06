package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.entity.AuthorEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AuthorMapper {
    Author toAuthor(AuthorEntity authorEntity);
    List<Author> toAuthorList(List<AuthorEntity> authorEntities);
}
