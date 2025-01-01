package com.adityachandel.booklore.service.metadata.parser.model;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class QueryData {
    private String isbn;
    private String bookTitle;
    private String author;
}
