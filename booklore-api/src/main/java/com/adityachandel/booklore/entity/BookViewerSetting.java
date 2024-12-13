package com.adityachandel.booklore.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "book_viewer_setting")
public class BookViewerSetting {
    @Id
    private Long bookId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "book_id")
    @JsonIgnore
    private Book book;

    @Column(name = "page_number")
    private int pageNumber;

    @Column(name = "zoom")
    private String zoom;

    @Column(name = "sidebar_visible")
    private boolean sidebar_visible;

    @Column(name = "spread")
    private String spread;
}