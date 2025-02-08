package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.service.LibraryService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/libraries")
@AllArgsConstructor
public class LibraryController {

    private LibraryService libraryService;

    @GetMapping
    public ResponseEntity<List<Library>> getLibraries() {
        return ResponseEntity.ok(libraryService.getLibraries());
    }

    @GetMapping("/{libraryId}")
    public ResponseEntity<Library> getLibrary(@PathVariable long libraryId) {
        return ResponseEntity.ok(libraryService.getLibrary(libraryId));
    }

    @PostMapping
    public ResponseEntity<Library> createLibrary(@RequestBody CreateLibraryRequest request) {
        return ResponseEntity.ok(libraryService.createLibrary(request));
    }

    @PutMapping("/{libraryId}")
    public ResponseEntity<Library> updateLibrary(@RequestBody CreateLibraryRequest request, @PathVariable Long libraryId) {
        return ResponseEntity.ok(libraryService.updateLibrary(request, libraryId));
    }

    @DeleteMapping("/{libraryId}")
    public ResponseEntity<?> deleteLibrary(@PathVariable long libraryId) {
        libraryService.deleteLibrary(libraryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{libraryId}/book/{bookId}")
    public ResponseEntity<Book> getBook(@PathVariable long libraryId, @PathVariable long bookId) {
        return ResponseEntity.ok(libraryService.getBook(libraryId, bookId));
    }

    @GetMapping("/{libraryId}/book")
    public ResponseEntity<List<Book>> getBooks(@PathVariable long libraryId) {
        List<Book> books = libraryService.getBooks(libraryId);
        return ResponseEntity.ok(books);
    }

    @PutMapping("/{libraryId}/refresh")
    public ResponseEntity<?> refreshLibrary(@PathVariable long libraryId) {
        libraryService.refreshLibrary(libraryId);
        return ResponseEntity.noContent().build();
    }
}