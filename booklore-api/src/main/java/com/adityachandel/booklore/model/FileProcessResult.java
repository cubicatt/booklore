package com.adityachandel.booklore.model;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.enums.ParsingStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileProcessResult {
    private LibraryFile libraryFile;
    private ParsingStatus parsingStatus;
    private Book book;
}
