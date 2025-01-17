package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.LibraryPath;
import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.entity.LibraryPathEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LibraryPathMapper {

    LibraryPath toLibraryPath(LibraryPathEntity libraryPathEntity);

    List<LibraryPath> toLibraryPathList(List<LibraryPathEntity> libraryPathEntities);
}
