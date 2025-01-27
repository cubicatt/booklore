package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.dto.Sort;
import com.adityachandel.booklore.service.ShelfService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping(("/api/v1/shelf"))
public class ShelfController {

    private final ShelfService shelfService;

    @GetMapping
    public ResponseEntity<List<Shelf>> findAll() {
        return ResponseEntity.ok(shelfService.getShelves());
    }

    @GetMapping("/{shelfId}")
    public ResponseEntity<Shelf> findById(@PathVariable Long shelfId) {
        return ResponseEntity.ok(shelfService.getShelf(shelfId));
    }

    @GetMapping("/{shelfId}/books")
    public ResponseEntity<List<Book>> getShelfBooks(@PathVariable Long shelfId) {
        return ResponseEntity.ok(shelfService.getShelfBooks(shelfId));
    }

    @PostMapping
    public ResponseEntity<Shelf> createShelf(@Valid @RequestBody ShelfCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shelfService.createShelf(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shelf> updateShelf(@PathVariable Long id, @Valid @RequestBody ShelfCreateRequest request) {
        return ResponseEntity.ok(shelfService.updateShelf(id, request));
    }

    @DeleteMapping("/{shelfId}")
    public ResponseEntity<Void> deleteShelf(@PathVariable Long shelfId) {
        shelfService.deleteShelf(shelfId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
