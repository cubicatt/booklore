package com.adityachandel.booklore.model.entity;

import com.adityachandel.booklore.model.enums.BookFileType;
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
public class BookEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", length = 1000)
    private String fileName;

    @Column(name = "file_sub_path")
    private String fileSubPath;

    @Column(name = "book_type")
    private BookFileType bookType;

    @OneToOne(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private BookMetadataEntity metadata;

    @ManyToOne
    @JoinColumn(name = "library_id", nullable = false)
    private LibraryEntity library;

    @ManyToOne
    @JoinColumn(name = "library_path_id", nullable = false)
    private LibraryPathEntity libraryPath;

    @OneToOne(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private PdfViewerPreferencesEntity pdfViewerPrefs;

    @OneToOne(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private EpubViewerPreferencesEntity epubViewerPrefs;

    @Column(name = "last_read_time")
    private Instant lastReadTime;

    @Column(name = "added_on")
    private Instant addedOn;

    @Column(name = "epub_progress")
    private String epubProgress;

    @Column(name = "pdf_progress")
    private Integer pdfProgress;

    @ManyToMany
    @JoinTable(
            name = "book_shelf_mapping",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "shelf_id")
    )
    private List<ShelfEntity> shelves;
}
