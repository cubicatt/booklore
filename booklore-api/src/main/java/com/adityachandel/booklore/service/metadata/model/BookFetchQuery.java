package com.adityachandel.booklore.service.metadata.model;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class BookFetchQuery {
    private String isbn;
    private String bookTitle;
    private String author;
}
