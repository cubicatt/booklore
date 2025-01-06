package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.ShelfEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShelfRepository extends JpaRepository<ShelfEntity, Long> {
    List<ShelfEntity> findShelfByName(String name);

    boolean existsByName(String name);
}
