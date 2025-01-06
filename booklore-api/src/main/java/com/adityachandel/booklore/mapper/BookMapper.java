package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.entity.BookEntity;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {BookMetadataMapper.class, ShelfMapper.class})
public interface BookMapper {

    @Mapping(source = "library.id", target = "libraryId")
    @Mapping(source = "metadata", target = "metadata")
    @Mapping(source = "shelves", target = "shelves")
    Book toBook(BookEntity bookEntity);

    @Mapping(source = "library.id", target = "libraryId")
    @Mapping(source = "metadata", target = "metadata")
    @Mapping(source = "shelves", target = "shelves")
    Book toBookWithDescription(BookEntity bookEntity, @Context boolean includeDescription);

}