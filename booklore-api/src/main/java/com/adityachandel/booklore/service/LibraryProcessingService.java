package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.model.stomp.BookNotification;
import com.adityachandel.booklore.model.stomp.Topic;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.adityachandel.booklore.model.stomp.BookNotification.Action.BOOKS_REMOVED;
import static com.adityachandel.booklore.model.stomp.BookNotification.Action.BOOK_ADDED;
import static com.adityachandel.booklore.model.stomp.LogNotification.createLogNotification;

@Service
@AllArgsConstructor
@Slf4j
public class LibraryProcessingService {

    private final LibraryRepository libraryRepository;
    private final NotificationService notificationService;
    private final PdfFileProcessor pdfFileProcessor;
    private final BookRepository bookRepository;


    @Transactional
    public void processLibrary(long libraryId) throws IOException {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        notificationService.sendMessage(Topic.LOG, createLogNotification("Started processing library: " + libraryEntity.getName()));
        List<LibraryFile> libraryFiles = getLibraryFiles(libraryEntity);
        processLibraryFiles(libraryFiles);
        notificationService.sendMessage(Topic.LOG, createLogNotification("Finished processing library: " + libraryEntity.getName()));
    }

    @Transactional
    public void refreshLibrary(long libraryId) throws IOException {
        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        notificationService.sendMessage(Topic.LOG, createLogNotification("Started refreshing library: " + libraryEntity.getName()));
        processLibraryFiles(getUnProcessedFiles(libraryEntity));
        deleteRemovedBooks(getRemovedBooks(libraryEntity));
        notificationService.sendMessage(Topic.LOG, createLogNotification("Finished refreshing library: " + libraryEntity.getName()));
    }

    @Transactional
    protected void deleteRemovedBooks(List<BookEntity> removedBookEntities) {
        if (!removedBookEntities.isEmpty()) {
            Set<Long> bookIds = removedBookEntities.stream().map(BookEntity::getId).collect(Collectors.toSet());
            bookRepository.deleteByIdIn(bookIds);
            BookNotification notification = BookNotification.builder().action(BOOKS_REMOVED).removedBookIds(bookIds).build();
            notificationService.sendMessage(Topic.BOOK, notification);
            log.info("Books removed: {}", bookIds);
        }
    }

    @Transactional
    protected void processLibraryFiles(List<LibraryFile> libraryFiles) {
        for (LibraryFile libraryFile : libraryFiles) {
            log.info("Processing file: {}", libraryFile.getFilePath());
            Book book = processLibraryFile(libraryFile);
            if (book != null) {
                BookNotification notification = BookNotification.builder().action(BOOK_ADDED).addedBook(book).build();
                notificationService.sendMessage(Topic.BOOK, notification);
                notificationService.sendMessage(Topic.LOG, createLogNotification("Book added: " + book.getFileName()));
                log.info("Processed file: {}", libraryFile.getFilePath());
            }
        }
    }

    @Transactional
    protected Book processLibraryFile(LibraryFile libraryFile) {
        if (libraryFile.getBookFileType() == BookFileType.PDF) {
            return pdfFileProcessor.processFile(libraryFile, false);
        }
        return null;
    }

    @Transactional
    protected List<BookEntity> getRemovedBooks(LibraryEntity libraryEntity) throws IOException {
        List<LibraryFile> libraryFiles = getLibraryFiles(libraryEntity);
        List<BookEntity> bookEntities = libraryEntity.getBookEntities();
        Set<String> libraryFilePaths = libraryFiles.stream()
                .map(LibraryFile::getFilePath)
                .collect(Collectors.toSet());
        return bookEntities.stream()
                .filter(book -> !libraryFilePaths.contains(book.getPath()))
                .collect(Collectors.toList());
    }

    @Transactional
    protected List<LibraryFile> getUnProcessedFiles(LibraryEntity libraryEntity) throws IOException {
        List<LibraryFile> libraryFiles = getLibraryFiles(libraryEntity);
        List<BookEntity> bookEntities = libraryEntity.getBookEntities();
        Set<String> processedPaths = bookEntities.stream()
                .map(BookEntity::getPath)
                .collect(Collectors.toSet());
        return libraryFiles.stream()
                .filter(libraryFile -> !processedPaths.contains(libraryFile.getFilePath()))
                .collect(Collectors.toList());
    }

    private List<LibraryFile> getLibraryFiles(LibraryEntity libraryEntity) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        for (String libraryPath : libraryEntity.getPaths()) {
            libraryFiles.addAll(findLibraryFiles(libraryPath, libraryEntity));
        }
        return libraryFiles;
    }

    private List<LibraryFile> findLibraryFiles(String directoryPath, LibraryEntity libraryEntity) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        try (var stream = Files.walk(Path.of(directoryPath))) {
            stream.filter(Files::isRegularFile)
                    .filter(file -> {
                        String fileName = file.getFileName().toString().toLowerCase();
                        return fileName.endsWith(".pdf") || fileName.endsWith(".epub");
                    })
                    .forEach(file -> {
                        BookFileType fileType = file.getFileName().toString().toLowerCase().endsWith(".pdf") ? BookFileType.PDF : BookFileType.EPUB;
                        libraryFiles.add(new LibraryFile(libraryEntity, file.toAbsolutePath().toString(), fileType));
                    });
        }
        return libraryFiles;
    }
}