package com.adityachandel.booklore.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "library_path")
public class LibraryPathEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_id", nullable = false)
    private LibraryEntity library;

    @OneToMany(mappedBy = "libraryPath", fetch = FetchType.LAZY)
    private List<BookEntity> books;

    @Column(nullable = false)
    private String path;
}
