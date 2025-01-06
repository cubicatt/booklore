package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.LibraryMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.model.dto.Sort;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.repository.BookEntityRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class LibraryService {

    private final LibraryRepository libraryRepository;
    private final BookEntityRepository bookEntityRepository;
    private final LibraryProcessingService libraryProcessingService;
    private final BookMapper bookMapper;
    private final LibraryMapper libraryMapper;

    public Library createLibrary(CreateLibraryRequest request) {
        LibraryEntity libraryEntity = LibraryEntity.builder()
                .name(request.getName())
                .paths(request.getPaths())
                .icon(request.getIcon())
                .build();
        libraryEntity = libraryRepository.save(libraryEntity);
        Long libraryId = libraryEntity.getId();
        Thread.startVirtualThread(() -> {
            try {
                libraryProcessingService.processLibrary(libraryId);
            } catch (InvalidDataAccessApiUsageException e) {
                log.warn("InvalidDataAccessApiUsageException - Library id: {}", libraryId);
            } catch (IOException e) {
                log.error("Error while parsing library books", e);
            }
            log.info("Parsing task completed!");
        });
        return libraryMapper.toLibrary(libraryEntity);
    }

    public void refreshLibrary(long libraryId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        Thread.startVirtualThread(() -> {
            try {
                libraryProcessingService.refreshLibrary(libraryId);
            } catch (InvalidDataAccessApiUsageException e) {
                log.warn("InvalidDataAccessApiUsageException - Library id: {}", libraryId);
            } catch (IOException e) {
                log.error("Error while parsing library books", e);
            }
            log.info("Parsing task completed!");
        });
    }

    public Library getLibrary(long libraryId) {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        return libraryMapper.toLibrary(libraryEntity);
    }

    public List<Library> getLibraries() {
        List<LibraryEntity> libraries = libraryRepository.findAll();
        return libraries.stream().map(libraryMapper::toLibrary).toList();
    }

    public void deleteLibrary(long id) {
        libraryRepository.findById(id).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(id));
        libraryRepository.deleteById(id);
    }

    public Book getBook(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        BookEntity bookEntity = bookEntityRepository.findBookByIdAndLibraryId(bookId, libraryId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return bookMapper.toBook(bookEntity);
    }

    public List<Book> getBooks(long libraryId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        List<BookEntity> bookEntities = bookEntityRepository.findBooksByLibraryId(libraryId);
        return bookEntities.stream().map(bookMapper::toBook).toList();
    }

    public Library updateSort(long libraryId, Sort sort) {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        libraryEntity.setSort(sort);
        return libraryMapper.toLibrary(libraryRepository.save(libraryEntity));
    }
}