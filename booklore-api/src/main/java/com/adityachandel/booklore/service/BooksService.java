package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.BookViewerSettingMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookViewerSetting;
import com.adityachandel.booklore.model.dto.BookWithNeighbors;
import com.adityachandel.booklore.model.dto.request.ReadProgressRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookViewerSettingEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.BookViewerSettingRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.util.FileService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final LibraryRepository libraryRepository;
    private final ShelfRepository shelfRepository;
    private final FileService fileService;
    private final BookMapper bookMapper;
    private final BookViewerSettingMapper bookViewerSettingMapper;


    public Book getBook(long bookId, boolean withDescription) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        Book book = bookMapper.toBook(bookEntity);
        if (!withDescription) {
            book.getMetadata().setDescription(null);
        }
        return book;
    }

    public List<Book> getBooks(boolean withDescription) {
        return bookRepository.findAll().stream()
                .map(bookEntity -> bookMapper.toBookWithDescription(bookEntity, withDescription))
                .collect(Collectors.toList());
    }

    public void saveBookViewerSetting(long bookId, BookViewerSetting bookViewerSettingDTO) {
        BookViewerSettingEntity bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        bookViewerSetting.setPageNumber(bookViewerSettingDTO.getPageNumber());
        bookViewerSetting.setZoom(bookViewerSettingDTO.getZoom());
        bookViewerSetting.setSpread(bookViewerSettingDTO.getSpread());
        bookViewerSetting.setSidebar_visible(bookViewerSettingDTO.getSidebar_visible());
        bookViewerSettingRepository.save(bookViewerSetting);
    }

    public ResponseEntity<byte[]> getBookData(long bookId) throws IOException {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        byte[] pdfBytes = Files.readAllBytes(new File(bookEntity.getPath()).toPath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdfBytes);
    }

    public List<Book> search(String title) {
        List<BookEntity> bookEntities = bookRepository.findByTitleContainingIgnoreCase(title);
        return bookEntities.stream().map(bookMapper::toBook).toList();
    }

    public BookViewerSetting getBookViewerSetting(long bookId) {
        BookViewerSettingEntity bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return bookViewerSettingMapper.toBookViewerSetting(bookViewerSetting);
    }

    public Book updateLastReadTime(long bookId) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        bookEntity.setLastReadTime(Instant.now());
        return bookMapper.toBook(bookRepository.save(bookEntity));
    }

    public BookWithNeighbors getBookWithNeighbours(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookEntity previousBookEntity = bookRepository.findFirstByLibraryIdAndIdLessThanOrderByIdDesc(libraryId, bookId).orElse(null);
        BookEntity nextBookEntity = bookRepository.findFirstByLibraryIdAndIdGreaterThanOrderByIdAsc(libraryId, bookId).orElse(null);
        return BookWithNeighbors.builder()
                .currentBook(bookMapper.toBook(bookEntity))
                .previousBookId(previousBookEntity != null ? previousBookEntity.getId() : null)
                .nextBookId(nextBookEntity != null ? nextBookEntity.getId() : null)
                .build();
    }

    @Transactional
    public List<Book> assignShelvesToBooks(Set<Long> bookIds, Set<Long> shelfIdsToAssign, Set<Long> shelfIdsToUnassign) {
        List<BookEntity> bookEntities = bookRepository.findAllById(bookIds);
        List<ShelfEntity> shelvesToAssign = shelfRepository.findAllById(shelfIdsToAssign);
        List<ShelfEntity> shelvesToUnassign = shelfRepository.findAllById(shelfIdsToUnassign);
        for (BookEntity bookEntity : bookEntities) {
            bookEntity.getShelves().removeIf(shelf -> shelfIdsToUnassign.contains(shelf.getId()));
            shelvesToUnassign.forEach(shelf -> shelf.getBookEntities().remove(bookEntity));
            shelvesToAssign.forEach(shelf -> {
                if (!bookEntity.getShelves().contains(shelf)) {
                    bookEntity.getShelves().add(shelf);
                }
                // Do remove contains, it's necessary
                if (!shelf.getBookEntities().contains(bookEntity)) {
                    shelf.getBookEntities().add(bookEntity);
                }
            });
            bookRepository.save(bookEntity);
            shelfRepository.saveAll(shelvesToAssign);
        }
        return bookEntities.stream().map(bookMapper::toBook).collect(Collectors.toList());
    }

    public Resource getBookCover(long bookId) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return fileService.getBookCover(bookEntity.getMetadata().getThumbnail());
    }

    public void updateReadProgress(ReadProgressRequest request) {
        BookEntity book = bookRepository.findById(request.getBookId()).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(request.getBookId()));
        book.setLastReadTime(Instant.now());
        if (book.getBookType() == BookFileType.EPUB) {
            book.setEpubProgress(request.getEpubProgress());
        } else if (book.getBookType() == BookFileType.PDF) {
            book.setPdfProgress(request.getPdfProgress());
        }
        bookRepository.save(book);
    }

    public ResponseEntity<Resource> prepareFileForDownload(Long bookId) {
        try {
            BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
            String filePath = bookEntity.getPath();
            Path file = Paths.get(filePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            throw ApiError.FAILED_TO_DOWNLOAD_FILE.createException(bookId);
        }
    }
}