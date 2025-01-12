package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.BooksMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.LibraryMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.quartz.JobSchedulerService;
import com.adityachandel.booklore.service.metadata.BookMetadataService;
import com.adityachandel.booklore.service.metadata.BookMetadataUpdater;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/metadata")
@AllArgsConstructor
public class MetadataController {

    private BookMetadataService bookMetadataService;
    private BookMetadataUpdater bookMetadataUpdater;
    private JobSchedulerService jobSchedulerService;
    private BookMetadataMapper bookMetadataMapper;

    @PostMapping("/{bookId}")
    public ResponseEntity<List<FetchedBookMetadata>> getBookMetadata(@RequestBody(required = false) FetchMetadataRequest fetchMetadataRequest, @PathVariable Long bookId) {
        return ResponseEntity.ok(bookMetadataService.fetchMetadataForRequest(bookId, fetchMetadataRequest));
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<BookMetadata> setBookMetadata(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId) {
        BookMetadata bookMetadata = bookMetadataMapper.toBookMetadata(bookMetadataUpdater.setBookMetadata(bookId, setMetadataRequest, true), false);
        return ResponseEntity.ok(bookMetadata);
    }

    @PutMapping("/{bookId}/source/{source}")
    public ResponseEntity<BookMetadata> setBookMetadata(@RequestBody FetchedBookMetadata setMetadataRequest, @PathVariable long bookId, @PathVariable MetadataProvider source) {
        BookMetadata bookMetadata = bookMetadataMapper.toBookMetadata(bookMetadataUpdater.setBookMetadata(bookId, setMetadataRequest, true), false);
        return ResponseEntity.ok(bookMetadata);
    }

    @PutMapping(path = "/refreshV2")
    public ResponseEntity<String> scheduleRefreshV2(@Validated @RequestBody MetadataRefreshRequest request) {
        jobSchedulerService.scheduleMetadataRefreshV2(request);
        return ResponseEntity.noContent().build();
    }
}
