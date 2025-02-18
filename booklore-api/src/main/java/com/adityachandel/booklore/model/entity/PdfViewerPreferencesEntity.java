package com.adityachandel.booklore.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pdf_viewer_preference")
public class PdfViewerPreferencesEntity {
    @Id
    private Long bookId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "book_id")
    @JsonIgnore
    private BookEntity book;

    @Column(name = "zoom")
    private String zoom;

    @Column(name = "spread")
    private String spread;
}