package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LibraryMapper {

    @Mapping(target = "paths", source = "libraryEntity.libraryPaths")
    Library toLibrary(LibraryEntity libraryEntity);

}
