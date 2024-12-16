package com.adityachandel.booklore.model;

import com.adityachandel.booklore.model.entity.Library;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LibraryFile {
    private Library library;
    private String filePath;
    private String fileType;
}
