package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.BookWithNeighborsDTO;
import com.adityachandel.booklore.model.dto.response.GoogleBooksMetadata;
import com.adityachandel.booklore.model.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.model.dto.request.SetMetadataRequest;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.transformer.BookSettingTransformer;
import com.adityachandel.booklore.transformer.BookTransformer;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@AllArgsConstructor
@Service
public class BooksService {

    private final AppProperties appProperties;
    private final BookRepository bookRepository;
    private final BookViewerSettingRepository bookViewerSettingRepository;
    private final GoogleBookMetadataService googleBookMetadataService;
    private final BookMetadataRepository metadataRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final LibraryRepository libraryRepository;
    private final NotificationService notificationService;
    private final ShelfRepository shelfRepository;


    public BookDTO getBook(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return BookTransformer.convertToBookDTO(book);
    }

    public List<BookDTO> getBooks() {
        return bookRepository.findAll().stream()
                .map(BookTransformer::convertToBookDTO)
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

    public Resource getBookCover(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        String thumbPath = appProperties.getPathConfig() + "/thumbs/" + getFileNameWithoutExtension(book.getFileName()) + ".jpg";
        Path filePath = Paths.get(thumbPath);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw ApiError.IMAGE_NOT_FOUND.createException(thumbPath);
            }
        } catch (IOException e) {
            throw ApiError.IMAGE_NOT_FOUND.createException(thumbPath);
        }
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
        if (!book.getMetadata().getTitle().isEmpty()) {
            searchString.append(book.getMetadata().getTitle());
        }
        if (searchString.isEmpty()) {
            searchString.append(book.getFileName());
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

    public void setMetadata(SetMetadataRequest setMetadataRequest, long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        GoogleBooksMetadata gMetadata = googleBookMetadataService.getByGoogleBookId(setMetadataRequest.getGoogleBookId());
        BookMetadata metadata = book.getMetadata();
        metadata.setGoogleBookId(gMetadata.getGoogleBookId());
        metadata.setDescription(gMetadata.getDescription());
        metadata.setTitle(gMetadata.getTitle());
        metadata.setLanguage(gMetadata.getLanguage());
        metadata.setPublisher(gMetadata.getPublisher());
        String publishedDate = gMetadata.getPublishedDate();
        if (publishedDate != null && !publishedDate.isEmpty()) {
            String normalizeDate = normalizeDate(publishedDate);
            metadata.setPublishedDate(normalizeDate);
        }
        metadata.setSubtitle(gMetadata.getSubtitle());
        metadata.setPageCount(gMetadata.getPageCount());
        metadata.setThumbnail(gMetadata.getThumbnail());
        if (gMetadata.getAuthors() != null && !gMetadata.getAuthors().isEmpty()) {
            List<Author> authors = gMetadata.getAuthors().stream()
                    .map(authorName -> authorRepository.findByName(authorName)
                            .orElseGet(() -> authorRepository.save(Author.builder().name(authorName).build())))
                    .collect(Collectors.toList());
            metadata.setAuthors(authors);
        }
        if (gMetadata.getCategories() != null && !gMetadata.getCategories().isEmpty()) {
            List<Category> categories = gMetadata
                    .getCategories()
                    .stream()
                    .map(c -> Arrays.stream(c.split("/"))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty() && !s.equalsIgnoreCase("General"))
                            .toList())
                    .flatMap(List::stream)
                    .collect(Collectors.toSet())
                    .stream()
                    .map(categoryName -> categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.save(Category.builder().name(categoryName).build())))
                    .collect(Collectors.toList());
            metadata.setCategories(categories);
        }
        metadata.setIsbn10(gMetadata.getIsbn10());
        metadata.setIsbn13(gMetadata.getIsbn13());
        authorRepository.saveAll(metadata.getAuthors());
        categoryRepository.saveAll(metadata.getCategories());
        metadataRepository.save(metadata);
    }

    public String normalizeDate(String input) {
        DateTimeFormatter fullDateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (input.matches("\\d{4}")) {
            return input + "-01-01";
        }
        try {
            LocalDate.parse(input, fullDateFormatter);
            return input;
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format: " + input);
        }
    }

    public String getFileNameWithoutExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex == -1) {
            return fileName;
        } else {
            return fileName.substring(0, dotIndex);
        }
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
            for (Shelf shelf : shelvesToUnassign) {
                Optional<Shelf> shelfOpt = book.getShelves().stream().filter(s -> s.getId().equals(shelf.getId())).findAny();
                shelfOpt.ifPresent(value -> book.getShelves().remove(value));
                shelf.getBooks().remove(book);
                shelfRepository.save(shelf);
            }
            for (Shelf shelf : shelvesToAssign) {
                Optional<Shelf> shelfOpt = book.getShelves().stream().filter(s -> s.getId().equals(shelf.getId())).findAny();
                if (shelfOpt.isEmpty()) {
                    book.getShelves().add(shelf);
                }
                Optional<Book> bookOpt = shelf.getBooks().stream().filter(b -> b.getId().equals(book.getId())).findAny();
                if (bookOpt.isEmpty()) {
                    shelf.getBooks().add(book);
                }
                shelfRepository.save(shelf);
            }
            bookRepository.save(book);
        }
        return books.stream().map(BookTransformer::convertToBookDTO).toList();
    }

}
