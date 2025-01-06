package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookMetadataRepository extends JpaRepository<BookMetadataEntity, Long> {
}
