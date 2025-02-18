package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.EpubViewerPreferencesMapper;
import com.adityachandel.booklore.mapper.PdfViewerPreferencesMapper;
import com.adityachandel.booklore.model.dto.*;
import com.adityachandel.booklore.model.dto.request.ReadProgressRequest;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.util.FileService;
import com.adityachandel.booklore.util.FileUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
    private final UserRepository userRepository;
    private final UserBookProgressRepository userBookProgressRepository;
    private final AuthenticationService authenticationService;
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
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        UserBookProgressEntity userProgress = userBookProgressRepository.findByUserIdAndBookId(user.getId(), bookId).orElse(new UserBookProgressEntity());
        Book book = bookMapper.toBook(bookEntity);
        book.setLastReadTime(userProgress.getLastReadTime());
        book.setPdfProgress(userProgress.getPdfProgress());
        book.setEpubProgress(userProgress.getEpubProgress());
        if (!withDescription) {
            book.getMetadata().setDescription(null);
        }
        return book;
    }

    public List<Book> getBooks(boolean withDescription) {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        BookLoreUserEntity userEntity = userRepository.findById(user.getId()).orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<BookEntity> books;
        if (userEntity.getPermissions().isPermissionAdmin()) {
            books = bookRepository.findAll();
        } else {
            Set<Long> userLibraryIds = userEntity.getLibraries().stream()
                    .map(LibraryEntity::getId)
                    .collect(Collectors.toSet());
            books = bookRepository.findByLibraryIdIn(userLibraryIds);
        }

        return books.stream()
                .map(bookEntity -> {
                    UserBookProgressEntity userProgress = userBookProgressRepository.findByUserIdAndBookId(user.getId(), bookEntity.getId())
                            .orElse(new UserBookProgressEntity());
                    Book book = bookMapper.toBookWithDescription(bookEntity, withDescription);
                    book.setLastReadTime(userProgress.getLastReadTime());
                    book.setPdfProgress(userProgress.getPdfProgress());
                    book.setEpubProgress(userProgress.getEpubProgress());
                    return book;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Book> assignShelvesToBooks(Set<Long> bookIds, Set<Long> shelfIdsToAssign, Set<Long> shelfIdsToUnassign) {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        BookLoreUserEntity userEntity = userRepository.findById(user.getId()).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(user.getId()));

        Set<Long> userShelfIds = userEntity.getShelves().stream()
                .map(ShelfEntity::getId)
                .collect(Collectors.toSet());

        if (!userShelfIds.containsAll(shelfIdsToAssign)) {
            throw ApiError.UNAUTHORIZED.createException("Cannot assign shelves that do not belong to the user.");
        }
        if (!userShelfIds.containsAll(shelfIdsToUnassign)) {
            throw ApiError.UNAUTHORIZED.createException("Cannot unassign shelves that do not belong to the user.");
        }

        List<BookEntity> bookEntities = bookRepository.findAllById(bookIds);
        List<ShelfEntity> shelvesToAssign = shelfRepository.findAllById(shelfIdsToAssign);
        for (BookEntity bookEntity : bookEntities) {
            bookEntity.getShelves().removeIf(shelf -> shelfIdsToUnassign.contains(shelf.getId()));

            for (ShelfEntity shelf : shelvesToAssign) {
                if (!bookEntity.getShelves().contains(shelf)) {
                    bookEntity.getShelves().add(shelf);
                }
            }
        }
        bookRepository.saveAll(bookEntities);
        return bookEntities.stream().map(bookMapper::toBook).collect(Collectors.toList());
    }

    public Resource getBookCover(long bookId) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return fileService.getBookCover(bookEntity.getMetadata().getThumbnail());
    }

    @Transactional
    public void updateReadProgress(ReadProgressRequest request) {
        BookEntity book = bookRepository.findById(request.getBookId()).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(request.getBookId()));
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        UserBookProgressEntity userBookProgress = userBookProgressRepository.findByUserIdAndBookId(user.getId(), book.getId()).orElse(new UserBookProgressEntity());
        userBookProgress.setUser(userRepository.findById(user.getId()).orElseThrow(() -> new UsernameNotFoundException("User not found")));
        userBookProgress.setBook(book);
        userBookProgress.setLastReadTime(Instant.now());
        if (book.getBookType() == BookFileType.EPUB && request.getEpubProgress() != null) {
            userBookProgress.setEpubProgress(request.getEpubProgress());
        } else if (book.getBookType() == BookFileType.PDF && request.getPdfProgress() != null) {
            userBookProgress.setPdfProgress(request.getPdfProgress());
        }
        userBookProgressRepository.save(userBookProgress);
    }

    public ResponseEntity<Resource> downloadBook(Long bookId) {
        try {
            BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
            Path file = Paths.get(FileUtils.getBookFullPath(bookEntity)).toAbsolutePath().normalize();
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            throw ApiError.FAILED_TO_DOWNLOAD_FILE.createException(bookId);
        }
    }

    public ResponseEntity<ByteArrayResource> getBookContent(long bookId) throws IOException {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        try (FileInputStream inputStream = new FileInputStream(FileUtils.getBookFullPath(bookEntity))) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new ByteArrayResource(inputStream.readAllBytes()));
        }
    }
}