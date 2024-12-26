package com.adityachandel.booklore.model.entity;

import com.adityachandel.booklore.convertor.SortConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "shelf")
public class Shelf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Convert(converter = SortConverter.class)
    private Sort sort;

    @ManyToMany(mappedBy = "shelves", fetch = FetchType.LAZY)
    private Set<Book> books = new HashSet<>();
}
