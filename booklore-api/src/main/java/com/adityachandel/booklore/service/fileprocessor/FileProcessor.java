package com.adityachandel.booklore.service.fileprocessor;

import com.adityachandel.booklore.model.dto.settings.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;

public interface FileProcessor {
    Book processFile(LibraryFile libraryFile, boolean forceProcess);
}
