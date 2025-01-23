package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.LibraryMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.model.dto.LibraryPath;
import com.adityachandel.booklore.model.dto.Sort;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.entity.LibraryPathEntity;
import com.adityachandel.booklore.model.websocket.Topic;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryPathRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.fileprocessor.FileProcessingUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class LibraryService {

    private final LibraryRepository libraryRepository;
    private final LibraryPathRepository libraryPathRepository;
    private final BookRepository bookRepository;
    private final LibraryProcessingService libraryProcessingService;
    private final BookMapper bookMapper;
    private final LibraryMapper libraryMapper;
    private final NotificationService notificationService;
    private final FileProcessingUtils fileProcessingUtils;

    public Library updateLibrary(CreateLibraryRequest request, Long libraryId) {
        LibraryEntity library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        library.setName(request.getName());
        library.setIcon(request.getIcon());

        Set<String> currentPaths = library.getLibraryPaths().stream().map(LibraryPathEntity::getPath).collect(Collectors.toSet());
        Set<String> updatedPaths = request.getPaths().stream().map(LibraryPath::getPath).collect(Collectors.toSet());

        Set<String> deletedPaths = currentPaths.stream().filter(path -> !updatedPaths.contains(path)).collect(Collectors.toSet());
        Set<String> newPaths = updatedPaths.stream().filter(path -> !currentPaths.contains(path)).collect(Collectors.toSet());

        if(newPaths.isEmpty() && deletedPaths.isEmpty()) {
            return libraryMapper.toLibrary(libraryRepository.save(library));
        } else {
            if (!deletedPaths.isEmpty()) {
                Set<LibraryPathEntity> pathsToRemove = library.getLibraryPaths().stream()
                        .filter(pathEntity -> deletedPaths.contains(pathEntity.getPath()))
                        .collect(Collectors.toSet());
                library.getLibraryPaths().removeAll(pathsToRemove);

                List<Long> books = bookRepository.findAllBookIdsByLibraryPathIdIn(pathsToRemove.stream().map(LibraryPathEntity::getId).collect(Collectors.toSet()));
                if (!books.isEmpty()) {
                    notificationService.sendMessage(Topic.BOOKS_REMOVE, books);
                }

                libraryPathRepository.deleteAll(pathsToRemove);
                libraryPathRepository.saveAll(library.getLibraryPaths());
                libraryRepository.save(library);
            }

            if (!newPaths.isEmpty()) {
                Set<LibraryPathEntity> newPathEntities = newPaths.stream()
                        .map(path -> LibraryPathEntity.builder().path(path).library(library).build())
                        .collect(Collectors.toSet());
                library.getLibraryPaths().addAll(newPathEntities);
                libraryPathRepository.saveAll(library.getLibraryPaths());
                libraryRepository.save(library);

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
            }
            return libraryMapper.toLibrary(libraryRepository.save(library));
        }
    }

    public Library createLibrary(CreateLibraryRequest request) {
        LibraryEntity libraryEntity = LibraryEntity.builder()
                .name(request.getName())
                .libraryPaths(
                        request.getPaths() == null || request.getPaths().isEmpty() ?
                                Collections.emptyList() :
                                request.getPaths().stream()
                                        .map(path -> LibraryPathEntity.builder().path(path.getPath()).build())
                                        .collect(Collectors.toList())
                )
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

    /*public void refreshLibrary(long libraryId) {
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
    }*/

    public Library getLibrary(long libraryId) {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        return libraryMapper.toLibrary(libraryEntity);
    }

    public List<Library> getLibraries() {
        List<LibraryEntity> libraries = libraryRepository.findAll();
        return libraries.stream().map(libraryMapper::toLibrary).toList();
    }

    public void deleteLibrary(long id) {
        LibraryEntity library = libraryRepository.findById(id).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(id));
        Set<Long> bookIds = library.getBookEntities().stream().map(BookEntity::getId).collect(Collectors.toSet());
        fileProcessingUtils.deleteBookCovers(bookIds);
        libraryRepository.deleteById(id);
    }

    public Book getBook(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        BookEntity bookEntity = bookRepository.findBookByIdAndLibraryId(bookId, libraryId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return bookMapper.toBook(bookEntity);
    }

    public List<Book> getBooks(long libraryId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        List<BookEntity> bookEntities = bookRepository.findBooksByLibraryId(libraryId);
        return bookEntities.stream().map(bookMapper::toBook).toList();
    }

    public Library updateSort(long libraryId, Sort sort) {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        libraryEntity.setSort(sort);
        return libraryMapper.toLibrary(libraryRepository.save(libraryEntity));
    }
}