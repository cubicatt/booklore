package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.model.entity.AuthorEntity;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.model.entity.CategoryEntity;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BookMetadataUpdater {

    private BookRepository bookRepository;
    private AuthorRepository authorRepository;
    private BookMetadataRepository bookMetadataRepository;
    private CategoryRepository categoryRepository;
    private FileService fileService;


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BookMetadataEntity setBookMetadata(long bookId, FetchedBookMetadata newMetadata, boolean setThumbnail) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookMetadataEntity metadata = bookEntity.getMetadata();

        metadata.setTitle(newMetadata.getTitle() != null && !newMetadata.getTitle().isBlank() ? newMetadata.getTitle() : metadata.getTitle());
        metadata.setSubtitle(newMetadata.getSubtitle() != null && !newMetadata.getSubtitle().isBlank() ? newMetadata.getSubtitle() : metadata.getSubtitle());
        metadata.setPublisher(newMetadata.getPublisher() != null && !newMetadata.getPublisher().isBlank() ? newMetadata.getPublisher() : metadata.getPublisher());
        metadata.setPublishedDate(newMetadata.getPublishedDate() != null ? newMetadata.getPublishedDate() : metadata.getPublishedDate());
        metadata.setLanguage(newMetadata.getLanguage() != null && !newMetadata.getLanguage().isBlank() ? newMetadata.getLanguage() : metadata.getLanguage());
        metadata.setIsbn10(newMetadata.getIsbn10() != null && !newMetadata.getIsbn10().isBlank() ? newMetadata.getIsbn10() : metadata.getIsbn10());
        metadata.setIsbn13(newMetadata.getIsbn13() != null && !newMetadata.getIsbn13().isBlank() ? newMetadata.getIsbn13() : metadata.getIsbn13());
        metadata.setDescription(newMetadata.getDescription() != null && !newMetadata.getDescription().isBlank() ? newMetadata.getDescription() : metadata.getDescription());
        metadata.setPageCount(newMetadata.getPageCount() != null ? newMetadata.getPageCount() : metadata.getPageCount());
        metadata.setRating(newMetadata.getRating() != null ? newMetadata.getRating() : metadata.getRating());
        metadata.setReviewCount(newMetadata.getReviewCount() != null ? newMetadata.getReviewCount() : metadata.getReviewCount());

        metadata.setAuthors(newMetadata.getAuthors() != null && !newMetadata.getAuthors().isEmpty() ?
                newMetadata.getAuthors().stream()
                        .map(authorName -> authorRepository.findByName(authorName)
                                .orElseGet(() -> authorRepository.save(AuthorEntity.builder().name(authorName).build())))
                        .collect(Collectors.toList())
                : metadata.getAuthors());

        metadata.setCategories(newMetadata.getCategories() != null && !newMetadata.getCategories().isEmpty() ?
                new HashSet<>(newMetadata.getCategories()).stream()
                        .map(categoryName -> categoryRepository.findByName(categoryName)
                                .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build())))
                        .collect(Collectors.toList())
                : metadata.getCategories());

        if (setThumbnail && newMetadata.getThumbnailUrl() != null && !newMetadata.getThumbnailUrl().isEmpty()) {
            String thumbnailPath = null;
            try {
                thumbnailPath = fileService.createThumbnail(bookId, newMetadata.getThumbnailUrl());
                bookEntity.setCoverUpdatedOn(Instant.now());
            } catch (IOException e) {
                log.error(e.getMessage());
            }
            metadata.setThumbnail(thumbnailPath);
        }

        if (!metadata.getAuthors().isEmpty()) {
            authorRepository.saveAll(metadata.getAuthors());
        }
        if (!metadata.getCategories().isEmpty()) {
            categoryRepository.saveAll(metadata.getCategories());
        }

        bookMetadataRepository.save(metadata);
        return metadata;
    }

}