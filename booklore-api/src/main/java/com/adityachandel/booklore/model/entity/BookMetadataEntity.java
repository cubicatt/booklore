package com.adityachandel.booklore.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "book_metadata")
public class BookMetadataEntity {

    @Id
    @Column(name = "book_id")
    private Long bookId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "subtitle")
    private String subtitle;

    @Column(name = "publisher")
    private String publisher;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "isbn_13", length = 13)
    private String isbn13;

    @Column(name = "isbn_10", length = 10)
    private String isbn10;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "thumbnail", length = 1000)
    private String thumbnail;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "book_id")
    @JsonIgnore
    private BookEntity book;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "book_metadata_author_mapping",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id"))
    private List<AuthorEntity> authors;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "book_metadata_category_mapping",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<CategoryEntity> categories;
}
