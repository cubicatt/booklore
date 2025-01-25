package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.BookAwardEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface BookMetadataRepository extends JpaRepository<BookMetadataEntity, Long> {

    @Query("SELECT b FROM BookAwardEntity b WHERE b.book.bookId = :bookId AND b.name = :name AND b.category = :category AND b.awardedAt = :awardedAt")
    BookAwardEntity findAwardByBookIdAndNameAndCategoryAndAwardedAt(@Param("bookId") Long bookId,
                                                                    @Param("name") String name,
                                                                    @Param("category") String category,
                                                                    @Param("awardedAt") LocalDate awardedAt);

}
