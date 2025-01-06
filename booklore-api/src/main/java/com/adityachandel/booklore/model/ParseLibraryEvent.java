package com.adityachandel.booklore.model;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.enums.ParsingStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParseLibraryEvent {
    private long libraryId;
    private String file;
    private Book book;
    private ParsingStatus parsingStatus;
}
