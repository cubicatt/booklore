package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.FileProcessResult;
import com.adityachandel.booklore.model.LibraryFile;

public interface FileProcessor {
    FileProcessResult processFile(LibraryFile libraryFile, boolean forceProcess);
}
