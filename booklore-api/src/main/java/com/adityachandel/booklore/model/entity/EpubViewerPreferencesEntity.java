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
@Table(name = "epub_viewer_preference")
public class EpubViewerPreferencesEntity {
    @Id
    private Long bookId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "book_id")
    @JsonIgnore
    private BookEntity book;

    @Column(name = "theme")
    private String theme;

    @Column(name = "font")
    private String font;

    @Column(name = "font_size")
    private Integer fontSize;
}