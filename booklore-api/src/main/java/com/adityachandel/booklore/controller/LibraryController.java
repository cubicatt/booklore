package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.BookWithNeighborsDTO;
import com.adityachandel.booklore.model.dto.LibraryDTO;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.Sort;
import com.adityachandel.booklore.service.BooksService;
import com.adityachandel.booklore.service.LibraryService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


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
    public ResponseEntity<List<LibraryDTO>> getLibraries() {
        return ResponseEntity.ok(libraryService.getLibraries());
    }

    @PostMapping
    public ResponseEntity<LibraryDTO> createLibraryNew(@RequestBody CreateLibraryRequest request) {
        return ResponseEntity.ok(libraryService.createLibrary(request));
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
    public ResponseEntity<List<BookDTO>> getBooks(@PathVariable long libraryId) {
        List<BookDTO> books = libraryService.getBooks(libraryId);
        return ResponseEntity.ok(books);
    }

    @PutMapping("/{libraryId}/sort")
    public ResponseEntity<LibraryDTO> updateLibrary(@PathVariable long libraryId, @RequestBody Sort sort) {
        return ResponseEntity.ok(libraryService.updateSort(libraryId, sort));
    }
}
