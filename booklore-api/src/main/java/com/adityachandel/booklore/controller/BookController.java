package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.dto.BookDTO;
import com.adityachandel.booklore.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.exception.APIException;
import com.adityachandel.booklore.exception.ErrorCode;
import com.adityachandel.booklore.service.BooksService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RequestMapping("/v1/book")
@RestController
@AllArgsConstructor
public class BookController {

    private BooksService booksService;

    @GetMapping("/{bookId}")
    public ResponseEntity<BookDTO> getBook(@PathVariable long bookId) {
        return ResponseEntity.ok(booksService.getBook(bookId));
    }

    @GetMapping()
    public ResponseEntity<Page<BookDTO>> getBooks(@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        Page<BookDTO> books = booksService.getBooks(page, size);
        return ResponseEntity.ok(books);
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

    @PutMapping("/{bookId}/viewer-setting")
    public ResponseEntity<Void> updateBookViewerSettings(@RequestBody BookViewerSettingDTO bookViewerSettingDTO, @PathVariable long bookId) {
        booksService.saveBookViewerSetting(bookId, bookViewerSettingDTO);
        return ResponseEntity.noContent().build();
    }
}