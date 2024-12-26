package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    Optional<Book> findByFileName(String fileName);

    List<Book> findBooksByLibraryId(Long libraryId);

    Optional<Book> findBookByIdAndLibraryId(long id, long libraryId);

    Optional<Book> findBookByFileNameAndLibraryId(String fileName, long libraryId);

    @Query("SELECT b FROM Book b JOIN b.metadata bm WHERE LOWER(bm.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    List<Book> findByTitleContainingIgnoreCase(@Param("title") String title);

    Page<Book> findByLastReadTimeIsNotNull(Pageable pageable);

    Page<Book> findByAddedOnIsNotNull(Pageable pageable);

    Optional<Book> findFirstByLibraryIdAndIdLessThanOrderByIdDesc(Long libraryId, Long currentBookId);

    Optional<Book> findFirstByLibraryIdAndIdGreaterThanOrderByIdAsc(Long libraryId, Long currentBookId);

    @Query("SELECT b FROM Book b JOIN b.shelves s WHERE s.id = :shelfId")
    List<Book> findByShelfId(@Param("shelfId") Long shelfId);

    @Modifying
    @Query("DELETE FROM Book b WHERE b.id IN (:ids)")
    void deleteByIdIn(Collection<Long> ids);
}

