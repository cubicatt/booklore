package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.AuthorMapper;
import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.mapper.CategoryMapper;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
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
    private BookMetadataMapper bookMetadataMapper;
    private AuthorMapper authorMapper;
    private CategoryMapper categoryMapper;
    private BookAwardRepository bookAwardRepository;


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BookMetadataEntity setBookMetadata(long bookId, FetchedBookMetadata newMetadata, boolean setThumbnail, boolean mergeCategories) {
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
        metadata.setSeriesName(newMetadata.getSeriesName() != null ? newMetadata.getSeriesName() : metadata.getSeriesName());
        metadata.setSeriesNumber(newMetadata.getSeriesNumber() != null ? newMetadata.getSeriesNumber() : metadata.getSeriesNumber());
        metadata.setSeriesTotal(newMetadata.getSeriesTotal() != null ? newMetadata.getSeriesTotal() : metadata.getSeriesTotal());

        if (newMetadata.getAwards() != null && !newMetadata.getAwards().isEmpty()) {
            HashSet<BookAwardEntity> newAwards = new HashSet<>();

            newMetadata.getAwards().forEach(award -> {
                boolean awardExists = bookMetadataRepository.findAwardByBookIdAndNameAndCategoryAndAwardedAt(
                        metadata.getBookId(),
                        award.getName(),
                        award.getCategory(),
                        award.getAwardedAt()) != null;

                if (!awardExists) {
                    BookAwardEntity awardEntity = new BookAwardEntity();
                    awardEntity.setBook(metadata);
                    awardEntity.setName(award.getName());
                    awardEntity.setCategory(award.getCategory());
                    awardEntity.setDesignation(award.getDesignation());
                    awardEntity.setAwardedAt(award.getAwardedAt() != null ? award.getAwardedAt() : Instant.now().atZone(ZoneId.systemDefault()).toLocalDate());

                    newAwards.add(awardEntity);
                }
            });
            if(!newAwards.isEmpty()) {
                metadata.setAwards(new ArrayList<>(newAwards));
                bookAwardRepository.saveAll(newAwards);
            }
        }

        metadata.setAuthors(newMetadata.getAuthors() != null && !newMetadata.getAuthors().isEmpty() ?
                newMetadata.getAuthors().stream()
                        .map(authorName -> authorRepository.findByName(authorName)
                                .orElseGet(() -> authorRepository.save(AuthorEntity.builder().name(authorName).build())))
                        .collect(Collectors.toList())
                : metadata.getAuthors());

        if (mergeCategories) {
            if (metadata.getCategories() != null) {
                HashSet<CategoryEntity> existingCategories = new HashSet<>(metadata.getCategories());
                newMetadata.getCategories().forEach(categoryName -> {
                    CategoryEntity categoryEntity = categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build()));
                    existingCategories.add(categoryEntity);
                });
                metadata.setCategories(new ArrayList<>(existingCategories));
            }
        } else {
            metadata.setCategories(newMetadata.getCategories() != null && !newMetadata.getCategories().isEmpty() ?
                    newMetadata.getCategories().stream()
                            .map(categoryName -> categoryRepository.findByName(categoryName)
                                    .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build())))
                            .collect(Collectors.toList())
                    : metadata.getCategories());
        }

        if (setThumbnail && newMetadata.getThumbnailUrl() != null && !newMetadata.getThumbnailUrl().isEmpty()) {
            String thumbnailPath = null;
            try {
                thumbnailPath = fileService.createThumbnail(bookId, newMetadata.getThumbnailUrl());
                metadata.setCoverUpdatedOn(Instant.now());
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

    public BookMetadata updateMetadata(long bookId, BookMetadata updatedMetadata) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookMetadataEntity metadata = bookEntity.getMetadata();

        if (updatedMetadata.getTitle() != null) {
            metadata.setTitle(updatedMetadata.getTitle());
        }
        if (updatedMetadata.getSubtitle() != null) {
            metadata.setSubtitle(updatedMetadata.getSubtitle());
        }
        if (updatedMetadata.getPublisher() != null) {
            metadata.setPublisher(updatedMetadata.getPublisher());
        }
        if (updatedMetadata.getSeriesName() != null) {
            metadata.setSeriesName(updatedMetadata.getSeriesName());
        }
        if (updatedMetadata.getSeriesNumber() != null) {
            metadata.setSeriesNumber(updatedMetadata.getSeriesNumber());
        }
        if (updatedMetadata.getSeriesTotal() != null) {
            metadata.setSeriesTotal(updatedMetadata.getSeriesTotal());
        }
        if (updatedMetadata.getPublishedDate() != null) {
            metadata.setPublishedDate(updatedMetadata.getPublishedDate());
        }
        if (updatedMetadata.getDescription() != null) {
            metadata.setDescription(updatedMetadata.getDescription());
        }
        if (updatedMetadata.getIsbn13() != null) {
            metadata.setIsbn13(updatedMetadata.getIsbn13());
        }
        if (updatedMetadata.getIsbn10() != null) {
            metadata.setIsbn10(updatedMetadata.getIsbn10());
        }
        if (updatedMetadata.getPageCount() != null) {
            metadata.setPageCount(updatedMetadata.getPageCount());
        }
        if (updatedMetadata.getLanguage() != null) {
            metadata.setLanguage(updatedMetadata.getLanguage());
        }
        if (updatedMetadata.getRating() != null) {
            metadata.setRating(updatedMetadata.getRating());
        }
        if (updatedMetadata.getReviewCount() != null) {
            metadata.setReviewCount(updatedMetadata.getReviewCount());
        }
        if (updatedMetadata.getCoverUpdatedOn() != null) {
            metadata.setCoverUpdatedOn(updatedMetadata.getCoverUpdatedOn());
        }
        if (updatedMetadata.getAuthors() != null) {
            metadata.setAuthors(authorMapper.toAuthorEntityList(updatedMetadata.getAuthors()));
        }
        if (updatedMetadata.getCategories() != null) {
            metadata.setCategories(categoryMapper.toCategoryEntities(updatedMetadata.getCategories()));
        }

        bookRepository.save(bookEntity);
        return bookMetadataMapper.toBookMetadata(metadata, false);
    }

}