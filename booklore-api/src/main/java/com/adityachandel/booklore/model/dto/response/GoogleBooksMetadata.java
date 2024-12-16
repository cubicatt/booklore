package com.adityachandel.booklore.model.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class GoogleBooksMetadata {
    private String googleBookId;
    private String title;
    private String subtitle;
    private String publisher;
    private String publishedDate;
    private String description;
    private String isbn13;
    private String isbn10;
    private Integer pageCount;
    private String thumbnail;
    private String language;
    private List<String> authors;
    private List<String> categories;
}
