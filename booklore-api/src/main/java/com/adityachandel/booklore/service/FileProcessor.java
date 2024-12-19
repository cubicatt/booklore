package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.FileProcessResult;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.BookDTO;

public interface FileProcessor {
    BookDTO processFile(LibraryFile libraryFile, boolean forceProcess);
}
