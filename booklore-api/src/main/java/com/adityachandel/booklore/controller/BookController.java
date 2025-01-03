package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.model.dto.request.ShelvesAssignmentRequest;
import com.adityachandel.booklore.service.BooksService;
import com.adityachandel.booklore.service.metadata.BookMetadataService;
import com.adityachandel.booklore.service.metadata.model.BookFetchQuery;
import com.adityachandel.booklore.service.metadata.model.BookMetadataSource;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RequestMapping("/v1/book")
@RestController
@AllArgsConstructor
public class BookController {

    private BooksService booksService;
    private BookMetadataService bookMetadataService;

    @GetMapping("/{bookId}")
    public ResponseEntity<BookDTO> getBook(@PathVariable long bookId, @RequestParam(required = false, defaultValue = "false") boolean withDescription) {
        return ResponseEntity.ok(booksService.getBook(bookId, withDescription));
    }

    @GetMapping
    public ResponseEntity<List<BookDTO>> getBooks(@RequestParam(required = false, defaultValue = "false") boolean withDescription) {
        return ResponseEntity.ok(booksService.getBooks(withDescription));
    }

    @GetMapping("/search")
    public ResponseEntity<List<BookDTO>> searchBooks(@RequestParam String title) {
        List<BookDTO> books = booksService.search(title);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/{bookId}/cover")
    public ResponseEntity<Resource> getBookCover(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.getBookCover(bookId));
    }

    @GetMapping("/{bookId}/data")
    public ResponseEntity<byte[]> getBookData(@PathVariable long bookId) throws IOException {
        return booksService.getBookData(bookId);
    }

    @GetMapping("/{bookId}/viewer-setting")
    public ResponseEntity<BookViewerSettingDTO> getBookViewerSettings(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.getBookViewerSetting(bookId));
    }

    @PutMapping("/{bookId}/viewer-setting")
    public ResponseEntity<Void> updateBookViewerSettings(@RequestBody BookViewerSettingDTO bookViewerSettingDTO, @PathVariable long bookId) {
        booksService.saveBookViewerSetting(bookId, bookViewerSettingDTO);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{bookId}/update-last-read")
    public ResponseEntity<BookDTO> updateBookViewerSettings(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.updateLastReadTime(bookId));
    }

    @PostMapping("/{bookId}/source/{source}/metadata")
    public ResponseEntity<FetchedBookMetadata> getBookMetadata(@RequestBody(required = false) BookFetchQuery bookFetchQuery, @PathVariable Long bookId, @PathVariable BookMetadataSource source) {
        return ResponseEntity.ok(bookMetadataService.fetchBookMetadata(bookId, source, bookFetchQuery));
    }

    @PutMapping("/{bookId}/source/{source}/metadata")
    public ResponseEntity<BookMetadataDTO> setBookMetadata(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId, @PathVariable BookMetadataSource source) {
        return ResponseEntity.ok(booksService.setBookMetadata(bookId, source, setMetadataRequest));
    }

    @PutMapping("/{bookId}/metadata")
    public ResponseEntity<BookMetadataDTO> setBookMetadataV2(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId) {
        return ResponseEntity.ok(booksService.setBookMetadataV2(bookId, setMetadataRequest));
    }

    @PostMapping("/assign-shelves")
    public ResponseEntity<List<BookDTO>> addBookToShelf(@RequestBody @Valid ShelvesAssignmentRequest request) {
        return ResponseEntity.ok(booksService.assignShelvesToBooks(request.getBookIds(), request.getShelvesToAssign(), request.getShelvesToUnassign()));
    }
}