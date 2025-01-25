package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.BookAwardEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface BookAwardRepository extends JpaRepository<BookAwardEntity, Long> {


}
