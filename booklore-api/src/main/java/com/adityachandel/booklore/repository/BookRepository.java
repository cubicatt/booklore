package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.entity.Book;
import com.adityachandel.booklore.entity.Library;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    Page<Book> findBooksByLibraryId(Long libraryId, Pageable pageable);

    Optional<Book> findBookByIdAndLibraryId(long id, long libraryId);

    List<Book> findByTitleContainingIgnoreCase(String title);
}

