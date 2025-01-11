package com.adityachandel.booklore.repository;

import com.adityachandel.booklore.model.entity.BookEntity;
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

@Repository
public interface BookRepository extends JpaRepository<BookEntity, Long>, JpaSpecificationExecutor<BookEntity> {

    List<BookEntity> findAllByIdIn(Collection<Long> ids);

    List<BookEntity> findBooksByLibraryId(Long libraryId);

    Optional<BookEntity> findBookByIdAndLibraryId(long id, long libraryId);

    Optional<BookEntity> findBookByFileNameAndLibraryId(String fileName, long libraryId);

    @Query("SELECT b FROM BookEntity b JOIN b.metadata bm WHERE LOWER(bm.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    List<BookEntity> findByTitleContainingIgnoreCase(@Param("title") String title);

    Optional<BookEntity> findFirstByLibraryIdAndIdLessThanOrderByIdDesc(Long libraryId, Long currentBookId);

    Optional<BookEntity> findFirstByLibraryIdAndIdGreaterThanOrderByIdAsc(Long libraryId, Long currentBookId);

    @Query("SELECT b FROM BookEntity b JOIN b.shelves s WHERE s.id = :shelfId")
    List<BookEntity> findByShelfId(@Param("shelfId") Long shelfId);

    @Modifying
    @Query("DELETE FROM BookEntity b WHERE b.id IN (:ids)")
    void deleteByIdIn(Collection<Long> ids);
}

