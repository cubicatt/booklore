package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.FieldLockRequest;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.quartz.JobSchedulerService;
import com.adityachandel.booklore.service.BookMetadataService;
import com.adityachandel.booklore.service.BookMetadataUpdater;
import com.adityachandel.booklore.model.dto.request.FetchMetadataRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/metadata")
@AllArgsConstructor
public class MetadataController {

    private BookMetadataService bookMetadataService;
    private BookMetadataUpdater bookMetadataUpdater;
    private JobSchedulerService jobSchedulerService;
    private BookMetadataMapper bookMetadataMapper;

    @PostMapping("/{bookId}")
    public ResponseEntity<List<BookMetadata>> getProspectiveMetadataList(@RequestBody(required = false) FetchMetadataRequest fetchMetadataRequest, @PathVariable Long bookId) {
        return ResponseEntity.ok(bookMetadataService.getProspectiveMetadataListForBookId(bookId, fetchMetadataRequest));
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<BookMetadata> updateMetadataFromFetch(@RequestBody BookMetadata setMetadataRequest, @PathVariable long bookId) {
        BookMetadata bookMetadata = bookMetadataMapper.toBookMetadata(bookMetadataUpdater.setBookMetadata(bookId, setMetadataRequest, true, true), true);
        return ResponseEntity.ok(bookMetadata);
    }

    @PutMapping(path = "/{bookId}/refresh-book-sync")
    public ResponseEntity<BookMetadata> quickRefreshBookSynchronized(@PathVariable Long bookId) {
        return ResponseEntity.ok(bookMetadataService.quickRefreshBookSynchronized(bookId));
    }

    @PutMapping(path = "/refreshV2")
    public ResponseEntity<String> scheduleRefreshV2(@Validated @RequestBody MetadataRefreshRequest request) {
        jobSchedulerService.scheduleMetadataRefreshV2(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bookId}/upload-cover")
    public ResponseEntity<BookMetadata> uploadCover(@PathVariable Long bookId, @RequestParam("file") MultipartFile file) {
        BookMetadata updatedMetadata = bookMetadataService.handleCoverUpload(bookId, file);
        return ResponseEntity.ok(updatedMetadata);
    }

    @PutMapping("/lock")
    public ResponseEntity<BookMetadata> updateFieldLockState(@RequestBody FieldLockRequest request) {
        long bookId = request.getBookId();
        String field = request.getField();
        boolean isLocked = request.getIsLocked();
        return ResponseEntity.ok(bookMetadataService.updateFieldLockState(bookId, field, isLocked));
    }
}