package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.LibraryPathEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LibraryPathRepository extends JpaRepository<LibraryPathEntity, Long> {

}
