package com.adityachandel.booklore.model.dtonew;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookMetadataDTONew {
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
    private List<AuthorDTONew> authors;
    private List<CategoryDTONew> categories;
}
