package com.adityachandel.booklore.model.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class BookMetadata {
    private Long bookId;
    private String title;
    private String subtitle;
    private String publisher;
    private LocalDate publishedDate;
    private String description;
    private String isbn13;
    private String isbn10;
    private Integer pageCount;
    private String language;
    private Float rating;
    private Integer reviewCount;
    private List<Author> authors;
    private List<Category> categories;
}
