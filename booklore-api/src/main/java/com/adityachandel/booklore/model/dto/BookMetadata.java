package com.adityachandel.booklore.model.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
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
    private String seriesName;
    private Integer seriesNumber;
    private Integer seriesTotal;
    private String isbn13;
    private String isbn10;
    private Integer pageCount;
    private String language;
    private Double rating;
    private Integer reviewCount;
    private Instant coverUpdatedOn;
    private List<Author> authors;
    private List<Category> categories;
    private List<Award> awards;

    private Boolean titleLocked;
    private Boolean subtitleLocked;
    private Boolean publisherLocked;
    private Boolean publishedDateLocked;
    private Boolean descriptionLocked;
    private Boolean isbn13Locked;
    private Boolean isbn10Locked;
    private Boolean pageCountLocked;
    private Boolean languageLocked;
    private Boolean ratingLocked;
    private Boolean reviewCountLocked;
    private Boolean coverLocked;
    private Boolean seriesNameLocked;
    private Boolean seriesNumberLocked;
    private Boolean seriesTotalLocked;
}
