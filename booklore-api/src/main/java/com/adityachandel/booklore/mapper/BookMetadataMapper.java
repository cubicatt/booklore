package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {AuthorMapper.class, CategoryMapper.class, AwardMapper.class})
public interface BookMetadataMapper {

    @Mapping(target = "description", ignore = true)
    BookMetadata toBookMetadata(BookMetadataEntity bookMetadataEntity, @Context boolean includeDescription);

    @AfterMapping
    default void mapWithDescriptionCondition(BookMetadataEntity bookMetadataEntity, @MappingTarget BookMetadata bookMetadata, @Context boolean includeDescription) {
        if (includeDescription) {
            bookMetadata.setDescription(bookMetadataEntity.getDescription());
        } else {
            bookMetadata.setDescription(null);
        }
    }
}