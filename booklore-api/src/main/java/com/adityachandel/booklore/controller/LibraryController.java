package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.dto.BookDTO;
import com.adityachandel.booklore.dto.LibraryDTO;
import com.adityachandel.booklore.dto.request.CreateLibraryRequest;
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

    @PostMapping(consumes = "application/json", produces = "application/json")
    public SseEmitter createLibrary(@RequestBody CreateLibraryRequest request) {
        return libraryService.createLibrary(request);
    }

    @GetMapping("/{libraryId}")
    public ResponseEntity<LibraryDTO> getLibrary(@PathVariable long libraryId) {
        return ResponseEntity.ok(libraryService.getLibrary(libraryId));
    }

    @DeleteMapping("/{libraryId}")
    public ResponseEntity<?> deleteLibrary(@PathVariable long libraryId) {
        libraryService.deleteLibrary(libraryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<LibraryDTO>> getLibraries(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(libraryService.getLibraries(page, size));
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
