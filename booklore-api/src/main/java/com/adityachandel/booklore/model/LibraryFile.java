package com.adityachandel.booklore.model;

import com.adityachandel.booklore.model.entity.Library;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class LibraryFile {
    private Library library;
    private String filePath;
    private String fileType;
}
