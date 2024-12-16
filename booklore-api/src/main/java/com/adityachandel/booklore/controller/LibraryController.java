package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.BookWithNeighborsDTO;
import com.adityachandel.booklore.model.dto.LibraryDTO;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.service.BooksService;
import com.adityachandel.booklore.service.LibraryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


@RestController
@RequestMapping("/v1/library")
@AllArgsConstructor
public class LibraryController {

    private LibraryService libraryService;
    private BooksService booksService;

    @GetMapping("/{libraryId}")
    public ResponseEntity<LibraryDTO> getLibrary(@PathVariable long libraryId) {
        return ResponseEntity.ok(libraryService.getLibrary(libraryId));
    }

    @GetMapping
    public ResponseEntity<Page<LibraryDTO>> getLibraries(@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(libraryService.getLibraries(page, size));
    }

    @PostMapping
    public ResponseEntity<LibraryDTO> createLibraryNew(@RequestBody CreateLibraryRequest request) {
        return ResponseEntity.ok(libraryService.createLibrary(request));
    }

    @GetMapping(path = "/{libraryId}/parse")
    public SseEmitter parseLibrary(@RequestParam(required = false, defaultValue = "false") boolean force, @PathVariable long libraryId) {
        return libraryService.parseLibraryBooks(libraryId, force);
    }



    @DeleteMapping("/{libraryId}")
    public ResponseEntity<?> deleteLibrary(@PathVariable long libraryId) {
        libraryService.deleteLibrary(libraryId);
        return ResponseEntity.noContent().build();
    }



    @GetMapping("/{libraryId}/book/{bookId}/withNeighbors")
    public ResponseEntity<BookWithNeighborsDTO> getBookWithNeighbours(@PathVariable long libraryId, @PathVariable long bookId) {
        return ResponseEntity.ok(booksService.getBookWithNeighbours(libraryId, bookId));
    }

    @GetMapping("/{libraryId}/book/{bookId}")
    public ResponseEntity<BookDTO> getBook(@PathVariable long libraryId, @PathVariable long bookId) {
        return ResponseEntity.ok(libraryService.getBook(libraryId, bookId));
    }

    @GetMapping("/{libraryId}/book")
    public ResponseEntity<Page<BookDTO>> getBooks(
            @PathVariable long libraryId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        Page<BookDTO> books = libraryService.getBooks(libraryId, page, size);
        return ResponseEntity.ok(books);
    }
}
