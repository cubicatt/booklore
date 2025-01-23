package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.EpubViewerPreferencesMapper;
import com.adityachandel.booklore.mapper.PdfViewerPreferencesMapper;
import com.adityachandel.booklore.model.dto.*;
import com.adityachandel.booklore.model.dto.request.ReadProgressRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.EpubViewerPreferencesEntity;
import com.adityachandel.booklore.model.entity.PdfViewerPreferencesEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.EpubViewerPreferencesRepository;
import com.adityachandel.booklore.repository.PdfViewerPreferencesRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.util.FileService;
import com.adityachandel.booklore.util.FileUtils;
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
    private final PdfViewerPreferencesRepository pdfViewerPreferencesRepository;
    private final EpubViewerPreferencesRepository epubViewerPreferencesRepository;
    private final ShelfRepository shelfRepository;
    private final FileService fileService;
    private final BookMapper bookMapper;
    private final PdfViewerPreferencesMapper pdfViewerPreferencesMapper;
    private final EpubViewerPreferencesMapper epubViewerPreferencesMapper;

    public BookViewerSettings getBookViewerSetting(long bookId) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        if (bookEntity.getBookType() == BookFileType.PDF) {
            return BookViewerSettings.builder().pdfSettings(pdfViewerPreferencesMapper.toModel(bookEntity.getPdfViewerPrefs())).build();
        } else if (bookEntity.getBookType() == BookFileType.EPUB) {
            return BookViewerSettings.builder().epubSettings(epubViewerPreferencesMapper.toModel(bookEntity.getEpubViewerPrefs())).build();
        } else {
            throw ApiError.UNSUPPORTED_BOOK_TYPE.createException();
        }
    }

    public void updateBookViewerSetting(long bookId, BookViewerSettings bookViewerSettings) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        if (bookEntity.getBookType() == BookFileType.PDF) {
            PdfViewerPreferences pdfSettings = bookViewerSettings.getPdfSettings();
            PdfViewerPreferencesEntity viewerPrefs = bookEntity.getPdfViewerPrefs();
            viewerPrefs.setZoom(pdfSettings.getZoom());
            viewerPrefs.setSpread(pdfSettings.getSpread());
            viewerPrefs.setSidebarVisible(pdfSettings.getSidebarVisible());
            pdfViewerPreferencesRepository.save(viewerPrefs);
        } else if (bookEntity.getBookType() == BookFileType.EPUB) {
            EpubViewerPreferences epubSettings = bookViewerSettings.getEpubSettings();
            EpubViewerPreferencesEntity viewerPrefs = bookEntity.getEpubViewerPrefs();
            viewerPrefs.setFont(epubSettings.getFont());
            viewerPrefs.setFontSize(epubSettings.getFontSize());
            viewerPrefs.setTheme(epubSettings.getTheme());
            epubViewerPreferencesRepository.save(viewerPrefs);
        } else {
            throw ApiError.UNSUPPORTED_BOOK_TYPE.createException();
        }
    }

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

    public ResponseEntity<byte[]> getBookData(long bookId) throws IOException {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        byte[] pdfBytes = Files.readAllBytes(new File(FileUtils.getBookFullPath(bookEntity)).toPath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/plain")
                .body(pdfBytes);
    }

    public List<Book> search(String title) {
        List<BookEntity> bookEntities = bookRepository.findByTitleContainingIgnoreCase(title);
        return bookEntities.stream().map(bookMapper::toBook).toList();
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
            Path file = Paths.get(FileUtils.getBookFullPath(bookEntity)).toAbsolutePath().normalize();
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