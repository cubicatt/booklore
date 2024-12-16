package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {

    Optional<Author> findByName(String name);

    @Query("SELECT a FROM Author a JOIN a.bookMetadataList bm WHERE bm.bookId = :bookId")
    List<Author> findAuthorsByBookId(@Param("bookId") Long bookId);
}

