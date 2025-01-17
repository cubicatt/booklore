package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookViewerSetting;
import com.adityachandel.booklore.model.dto.BookViewerSettings;
import com.adityachandel.booklore.model.dto.request.ReadProgressRequest;
import com.adityachandel.booklore.model.dto.request.ShelvesAssignmentRequest;
import com.adityachandel.booklore.service.BooksService;
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

    @GetMapping("/{bookId}")
    public ResponseEntity<Book> getBook(@PathVariable long bookId, @RequestParam(required = false, defaultValue = "false") boolean withDescription) {
        return ResponseEntity.ok(booksService.getBook(bookId, withDescription));
    }

    @GetMapping
    public ResponseEntity<List<Book>> getBooks(@RequestParam(required = false, defaultValue = "false") boolean withDescription) {
        return ResponseEntity.ok(booksService.getBooks(withDescription));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String title) {
        List<Book> books = booksService.search(title);
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

    @GetMapping("/{bookId}/book-viewer-setting")
    public ResponseEntity<BookViewerSettings> getBookViewerSettings(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.getBookViewerSetting(bookId));
    }

    @PutMapping("/{bookId}/book-viewer-setting")
    public ResponseEntity<Void> updateBookViewerSettings(@RequestBody BookViewerSettings bookViewerSettings, @PathVariable long bookId) {
        booksService.updateBookViewerSetting(bookId, bookViewerSettings);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{bookId}/update-last-read")
    public ResponseEntity<Book> updateBookViewerSettings(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.updateLastReadTime(bookId));
    }

    @PostMapping("/assign-shelves")
    public ResponseEntity<List<Book>> addBookToShelf(@RequestBody @Valid ShelvesAssignmentRequest request) {
        return ResponseEntity.ok(booksService.assignShelvesToBooks(request.getBookIds(), request.getShelvesToAssign(), request.getShelvesToUnassign()));
    }

    @PostMapping("/progress")
    public ResponseEntity<Void> addBookToProgress(@RequestBody @Valid ReadProgressRequest request) {
        booksService.updateReadProgress(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable("bookId") Long bookId) {
        return booksService.prepareFileForDownload(bookId);
    }
}