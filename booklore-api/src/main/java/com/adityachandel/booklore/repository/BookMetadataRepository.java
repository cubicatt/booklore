package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.BookMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookMetadataRepository extends JpaRepository<BookMetadata, Long> {
}
