package com.adityachandel.booklore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "book")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", length = 1000)
    private String fileName;

    @Column(name = "title")
    private String title;

    @Column(name = "path")
    private String path;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "book_author_mapping",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private List<Author> authors;

    @ManyToOne
    @JoinColumn(name = "library_id", nullable = false)
    private Library library;

    @OneToOne(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private BookViewerSetting viewerSetting;

    @Column(name = "last_read_time")
    private Instant lastReadTime;
}
