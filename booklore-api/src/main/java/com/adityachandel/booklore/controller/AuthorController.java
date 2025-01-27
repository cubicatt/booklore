package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.service.AuthorService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/v1/authors")
@RestController
@AllArgsConstructor
public class AuthorController {

    private AuthorService authorService;

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<String>> getAuthorsByBookId(@PathVariable long bookId) {
        return ResponseEntity.ok(authorService.getAuthorsByBookId(bookId));
    }
}
