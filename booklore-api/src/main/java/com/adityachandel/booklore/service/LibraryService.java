package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.LibraryDTO;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.transformer.LibraryTransformer;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class LibraryService {

    private LibraryRepository libraryRepository;
    private BookRepository bookRepository;
    private final LibraryProcessingService libraryProcessingService;

    public LibraryDTO createLibrary(CreateLibraryRequest request) {
        Library library = Library.builder()
                .name(request.getName())
                .paths(request.getPaths())
                .build();
        library = libraryRepository.save(library);
        Long libraryId = library.getId();

        Thread.startVirtualThread(() -> {
            log.info("Running in a virtual thread: {}", Thread.currentThread());
            try {
                libraryProcessingService.parseLibraryBooks(libraryId);
            } catch (InvalidDataAccessApiUsageException e) {
                log.warn("InvalidDataAccessApiUsageException - Library id: {}", libraryId);
            } catch (IOException e) {
                log.error("Error while parsing library books", e);
            }
            log.info("Parsing task completed!");
        });

        return LibraryTransformer.convertToLibraryDTO(library);
    }

    public LibraryDTO getLibrary(long libraryId) {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        return LibraryTransformer.convertToLibraryDTO(library);
    }

    public List<LibraryDTO> getLibraries() {
        List<Library> libraries = libraryRepository.findAll();
        return libraries.stream().map(LibraryTransformer::convertToLibraryDTO).toList();
    }

    public void deleteLibrary(long id) {
        libraryRepository.findById(id).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(id));
        libraryRepository.deleteById(id);
    }

    public BookDTO getBook(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        Book book = bookRepository.findBookByIdAndLibraryId(bookId, libraryId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return BookTransformer.convertToBookDTO(book);
    }

    public List<BookDTO> getBooks(long libraryId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        List<Book> books = bookRepository.findBooksByLibraryId(libraryId);
        return books.stream().map(BookTransformer::convertToBookDTO).toList();
    }
}
