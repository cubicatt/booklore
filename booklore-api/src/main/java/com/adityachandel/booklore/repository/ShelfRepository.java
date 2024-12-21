package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.Shelf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShelfRepository extends JpaRepository<Shelf, Long> {
    List<Shelf> findShelfByName(String name);

    boolean existsByName(String name);
}
