package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;

public interface FileProcessor {
    Book processFile(LibraryFile libraryFile, boolean forceProcess);
}
