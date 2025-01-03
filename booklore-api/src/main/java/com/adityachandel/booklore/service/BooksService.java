package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.model.dto.BookWithNeighborsDTO;
import com.adityachandel.booklore.model.dto.response.GoogleBooksMetadata;
import com.adityachandel.booklore.model.entity.Author;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.BookViewerSetting;
import com.adityachandel.booklore.model.entity.Shelf;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.service.metadata.BookMetadataService;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.transformer.BookSettingTransformer;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.util.BookUtils;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@AllArgsConstructor
@Service
public class BooksService {

    private final BookRepository bookRepository;
    private final BookViewerSettingRepository bookViewerSettingRepository;
    private final GoogleBookMetadataService googleBookMetadataService;
    private final LibraryRepository libraryRepository;
    private final ShelfRepository shelfRepository;
    private final FileService fileService;
    private final BookMetadataService bookMetadataService;


    public BookDTO getBook(long bookId, boolean withDescription) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookDTO bookDTO = BookTransformer.convertToBookDTO(book);
        if (!withDescription) {
            bookDTO.getMetadata().setDescription(null);
        }
        return bookDTO;
    }

    public List<BookDTO> getBooks(boolean withDescription) {
        return bookRepository.findAll().stream()
                .map(BookTransformer::convertToBookDTO)
                .peek(bookDTO -> {
                    if (!withDescription) {
                        bookDTO.getMetadata().setDescription(null);
                    }
                })
                .collect(Collectors.toList());
    }

    public void saveBookViewerSetting(long bookId, BookViewerSettingDTO bookViewerSettingDTO) {
        BookViewerSetting bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        bookViewerSetting.setPageNumber(bookViewerSettingDTO.getPageNumber());
        bookViewerSetting.setZoom(bookViewerSettingDTO.getZoom());
        bookViewerSetting.setSpread(bookViewerSettingDTO.getSpread());
        bookViewerSetting.setSidebar_visible(bookViewerSettingDTO.isSidebar_visible());
        bookViewerSettingRepository.save(bookViewerSetting);
    }

    public ResponseEntity<byte[]> getBookData(long bookId) throws IOException {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        byte[] pdfBytes = Files.readAllBytes(new File(book.getPath()).toPath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdfBytes);
    }

    public List<BookDTO> search(String title) {
        List<Book> books = bookRepository.findByTitleContainingIgnoreCase(title);
        return books.stream().map(BookTransformer::convertToBookDTO).toList();
    }

    public BookViewerSettingDTO getBookViewerSetting(long bookId) {
        BookViewerSetting bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return BookSettingTransformer.convertToDTO(bookViewerSetting);
    }

    public BookDTO updateLastReadTime(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        book.setLastReadTime(Instant.now());
        return BookTransformer.convertToBookDTO(bookRepository.save(book));
    }

    public List<GoogleBooksMetadata> fetchProspectiveMetadataListByBookId(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        StringBuilder searchString = new StringBuilder();
        if (book.getMetadata().getTitle() != null && !book.getMetadata().getTitle().isEmpty()) {
            searchString.append(book.getMetadata().getTitle());
        }
        if (searchString.isEmpty()) {
            searchString.append(BookUtils.cleanFileName(book.getFileName()));
        }
        if (book.getMetadata().getAuthors() != null && !book.getMetadata().getAuthors().isEmpty()) {
            if (!searchString.isEmpty()) {
                searchString.append(" ");
            }
            searchString.append(book.getMetadata().getAuthors().stream()
                    .map(Author::getName)
                    .collect(Collectors.joining(", ")));
        }
        return googleBookMetadataService.queryByTerm(searchString.toString());
    }

    public List<GoogleBooksMetadata> fetchProspectiveMetadataListBySearchTerm(String searchTerm) {
        return googleBookMetadataService.queryByTerm(searchTerm);
    }


    public BookWithNeighborsDTO getBookWithNeighbours(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        Book previousBook = bookRepository.findFirstByLibraryIdAndIdLessThanOrderByIdDesc(libraryId, bookId).orElse(null);
        Book nextBook = bookRepository.findFirstByLibraryIdAndIdGreaterThanOrderByIdAsc(libraryId, bookId).orElse(null);
        return BookWithNeighborsDTO.builder()
                .currentBook(BookTransformer.convertToBookDTO(book))
                .previousBookId(previousBook != null ? previousBook.getId() : null)
                .nextBookId(nextBook != null ? nextBook.getId() : null)
                .build();
    }

    @Transactional
    public List<BookDTO> assignShelvesToBooks(Set<Long> bookIds, Set<Long> shelfIdsToAssign, Set<Long> shelfIdsToUnassign) {
        List<Book> books = bookRepository.findAllById(bookIds);
        List<Shelf> shelvesToAssign = shelfRepository.findAllById(shelfIdsToAssign);
        List<Shelf> shelvesToUnassign = shelfRepository.findAllById(shelfIdsToUnassign);
        for (Book book : books) {
            book.getShelves().removeIf(shelf -> shelfIdsToUnassign.contains(shelf.getId()));
            shelvesToUnassign.forEach(shelf -> shelf.getBooks().remove(book));
            shelvesToAssign.forEach(shelf -> {
                if (!book.getShelves().contains(shelf)) {
                    book.getShelves().add(shelf);
                }
                if (!shelf.getBooks().contains(book)) {
                    shelf.getBooks().add(book);
                }
            });
            bookRepository.save(book);
            shelfRepository.saveAll(shelvesToAssign);
        }
        return books.stream().map(BookTransformer::convertToBookDTO).collect(Collectors.toList());
    }

    public Resource getBookCover(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return fileService.getBookCover(book.getMetadata().getThumbnail());
    }

    public BookMetadataDTO setBookMetadata(long bookId, MetadataProvider source, FetchedBookMetadata setMetadataRequest) {
        return bookMetadataService.setBookMetadata(bookId, setMetadataRequest, source);
    }

    public BookMetadataDTO setBookMetadataV2(long bookId, FetchedBookMetadata setMetadataRequest) {
        return bookMetadataService.setBookMetadata(bookId, setMetadataRequest, MetadataProvider.AMAZON);
    }
}