package com.adityachandel.booklore.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookMetadataDTO {
    private Long bookId;
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
    private List<AuthorDTO> authors;
    private List<CategoryDTO> categories;
}
