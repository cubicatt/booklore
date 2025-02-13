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
@RequestMapping("/api/v1/books")
@AllArgsConstructor
public class MetadataController {

    private BookMetadataService bookMetadataService;
    private BookMetadataUpdater bookMetadataUpdater;
    private JobSchedulerService jobSchedulerService;
    private BookMetadataMapper bookMetadataMapper;

    @PostMapping("/{bookId}/metadata/prospective")
    public ResponseEntity<List<BookMetadata>> getMetadataList(@RequestBody(required = false) FetchMetadataRequest fetchMetadataRequest, @PathVariable Long bookId) {
        return ResponseEntity.ok(bookMetadataService.getProspectiveMetadataListForBookId(bookId, fetchMetadataRequest));
    }

    @PutMapping("/{bookId}/metadata")
    public ResponseEntity<BookMetadata> updateMetadata(
            @RequestBody BookMetadata setMetadataRequest, @PathVariable long bookId,
            @RequestParam(defaultValue = "true") boolean mergeCategories) {
        BookMetadata bookMetadata = bookMetadataMapper.toBookMetadata(
                bookMetadataUpdater.setBookMetadata(bookId, setMetadataRequest, true, mergeCategories), true);
        return ResponseEntity.ok(bookMetadata);
    }

    @PutMapping(path = "/metadata/refresh")
    public ResponseEntity<String> scheduleRefreshV2(@Validated @RequestBody MetadataRefreshRequest request) {
        jobSchedulerService.scheduleMetadataRefresh(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bookId}/metadata/cover")
    public ResponseEntity<BookMetadata> uploadCover(@PathVariable Long bookId, @RequestParam("file") MultipartFile file) {
        BookMetadata updatedMetadata = bookMetadataService.handleCoverUpload(bookId, file);
        return ResponseEntity.ok(updatedMetadata);
    }

    @PutMapping("/{bookId}/metadata/lock")
    public ResponseEntity<BookMetadata> updateFieldLockState(@RequestBody FieldLockRequest request) {
        long bookId = request.getBookId();
        String field = request.getField();
        boolean isLocked = request.getIsLocked();
        return ResponseEntity.ok(bookMetadataService.updateFieldLockState(bookId, field, isLocked));
    }
}