package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.model.stomp.BookNotification;
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
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        List<LibraryFile> libraryFiles = getLibraryFiles(library);
        processLibraryFiles(libraryFiles);
    }

    @Transactional
    public void refreshLibrary(long libraryId) throws IOException {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        processLibraryFiles(getUnProcessedFiles(library));
        deleteRemovedBooks(getRemovedBooks(library));
    }

    @Transactional
    protected void deleteRemovedBooks(List<Book> removedBooks) {
        if (!removedBooks.isEmpty()) {
            Set<Long> bookIds = removedBooks.stream().map(Book::getId).collect(Collectors.toSet());
            bookRepository.deleteByIdIn(bookIds);
            BookNotification notification = BookNotification.builder().action(BOOKS_REMOVED).removedBookIds(bookIds).build();
            notificationService.sendMessage("/topic/books", notification);
            log.info("Books removed: {}", bookIds);
        }
    }

    @Transactional
    protected void processLibraryFiles(List<LibraryFile> libraryFiles) {
        for (LibraryFile libraryFile : libraryFiles) {
            log.info("Processing file: {}", libraryFile.getFilePath());
            BookDTO bookDTO = processLibraryFile(libraryFile);
            if (bookDTO != null) {
                BookNotification notification = BookNotification.builder().action(BOOK_ADDED).addedBook(bookDTO).build();
                notificationService.sendMessage("/topic/books", notification);
                notificationService.sendMessage("/topic/logs", "Book added: " + bookDTO.getFileName());
                log.info("Processed file: {}", libraryFile.getFilePath());
            }
        }
    }

    @Transactional
    protected BookDTO processLibraryFile(LibraryFile libraryFile) {
        if (libraryFile.getBookFileType() == BookFileType.PDF) {
            return pdfFileProcessor.processFile(libraryFile, false);
        }
        return null;
    }

    @Transactional
    protected List<Book> getRemovedBooks(Library library) throws IOException {
        List<LibraryFile> libraryFiles = getLibraryFiles(library);
        List<Book> books = library.getBooks();
        Set<String> libraryFilePaths = libraryFiles.stream()
                .map(LibraryFile::getFilePath)
                .collect(Collectors.toSet());
        return books.stream()
                .filter(book -> !libraryFilePaths.contains(book.getPath()))
                .collect(Collectors.toList());
    }

    @Transactional
    protected List<LibraryFile> getUnProcessedFiles(Library library) throws IOException {
        List<LibraryFile> libraryFiles = getLibraryFiles(library);
        List<Book> books = library.getBooks();
        Set<String> processedPaths = books.stream()
                .map(Book::getPath)
                .collect(Collectors.toSet());
        return libraryFiles.stream()
                .filter(libraryFile -> !processedPaths.contains(libraryFile.getFilePath()))
                .collect(Collectors.toList());
    }

    private List<LibraryFile> getLibraryFiles(Library library) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        for (String libraryPath : library.getPaths()) {
            libraryFiles.addAll(findLibraryFiles(libraryPath, library));
        }
        return libraryFiles;
    }

    private List<LibraryFile> findLibraryFiles(String directoryPath, Library library) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        try (var stream = Files.walk(Path.of(directoryPath))) {
            stream.filter(Files::isRegularFile)
                    .filter(file -> {
                        String fileName = file.getFileName().toString().toLowerCase();
                        return fileName.endsWith(".pdf") || fileName.endsWith(".epub");
                    })
                    .forEach(file -> {
                        BookFileType fileType = file.getFileName().toString().toLowerCase().endsWith(".pdf") ? BookFileType.PDF : BookFileType.EPUB;
                        libraryFiles.add(new LibraryFile(library, file.toAbsolutePath().toString(), fileType));
                    });
        }
        return libraryFiles;
    }


}

