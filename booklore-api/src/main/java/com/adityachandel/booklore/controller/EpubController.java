package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.service.EpubService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/epub")
public class EpubController {

    private final EpubService epubService;

    public EpubController(EpubService epubService) {
        this.epubService = epubService;
    }

    // New endpoint to serve the entire EPUB file
    @GetMapping("/{bookId}/download")
    public ResponseEntity<ByteArrayResource> downloadEpub(@PathVariable Long bookId) throws IOException {
        ByteArrayResource epubFile = epubService.getEpubFile(bookId);
        return ResponseEntity.ok()
                .header("Content-Type", "application/epub+zip")
                .header("Content-Disposition", "attachment; filename=\"book.epub\"")
                .body(epubFile);
    }
}