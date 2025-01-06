package com.adityachandel.booklore.model;

import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class LibraryFile {
    private LibraryEntity libraryEntity;
    private String filePath;
    private BookFileType bookFileType;
}
