package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LibraryMapper {

    Library toLibrary(LibraryEntity libraryEntity);

    List<Library> toLibraryList(List<LibraryEntity> libraryEntities);
}
