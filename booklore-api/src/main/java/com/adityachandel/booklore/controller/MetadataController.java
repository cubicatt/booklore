package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.service.metadata.BookMetadataService;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/metadata")
@AllArgsConstructor
public class MetadataController {

    private BookMetadataService bookMetadataService;

    @PostMapping("/{bookId}")
    public ResponseEntity<List<FetchedBookMetadata>> getBookMetadata(@RequestBody(required = false) FetchMetadataRequest fetchMetadataRequest, @PathVariable Long bookId) {
        return ResponseEntity.ok(bookMetadataService.fetchMetadataList(bookId, fetchMetadataRequest));
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<BookMetadata> setBookMetadata(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId) {
        return ResponseEntity.ok(bookMetadataService.setBookMetadata(bookId, setMetadataRequest, MetadataProvider.AMAZON, true));
    }

    @PutMapping("/{bookId}/source/{source}")
    public ResponseEntity<BookMetadata> setBookMetadata(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId, @PathVariable MetadataProvider source) {
        return ResponseEntity.ok(bookMetadataService.setBookMetadata(bookId, setMetadataRequest, source, true));
    }

    @PostMapping(path = "/refresh")
    public ResponseEntity<?> scheduleRefresh(@RequestBody MetadataRefreshRequest request) {
        bookMetadataService.refreshMetadata(request);
        return ResponseEntity.noContent().build();
    }

}
