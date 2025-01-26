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
    private BookMetadataMapper bookMetadataMapper;
    private AuthorMapper authorMapper;
    private CategoryMapper categoryMapper;
    private BookAwardRepository bookAwardRepository;


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BookMetadataEntity setBookMetadata(long bookId, FetchedBookMetadata newMetadata, boolean setThumbnail, boolean mergeCategories) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookMetadataEntity metadata = bookEntity.getMetadata();

        if (!metadata.getTitleLocked() && newMetadata.getTitle() != null && !newMetadata.getTitle().isBlank()) {
            metadata.setTitle(newMetadata.getTitle());
        }
        if (!metadata.getSubtitleLocked() && newMetadata.getSubtitle() != null && !newMetadata.getSubtitle().isBlank()) {
            metadata.setSubtitle(newMetadata.getSubtitle());
        }
        if (!metadata.getPublisherLocked() && newMetadata.getPublisher() != null && !newMetadata.getPublisher().isBlank()) {
            metadata.setPublisher(newMetadata.getPublisher());
        }
        if (!metadata.getPublishedDateLocked() && newMetadata.getPublishedDate() != null) {
            metadata.setPublishedDate(newMetadata.getPublishedDate());
        }
        if (!metadata.getLanguageLocked() && newMetadata.getLanguage() != null && !newMetadata.getLanguage().isBlank()) {
            metadata.setLanguage(newMetadata.getLanguage());
        }
        if (!metadata.getIsbn10Locked() && newMetadata.getIsbn10() != null && !newMetadata.getIsbn10().isBlank()) {
            metadata.setIsbn10(newMetadata.getIsbn10());
        }
        if (!metadata.getIsbn13Locked() && newMetadata.getIsbn13() != null && !newMetadata.getIsbn13().isBlank()) {
            metadata.setIsbn13(newMetadata.getIsbn13());
        }
        if (!metadata.getDescriptionLocked() && newMetadata.getDescription() != null && !newMetadata.getDescription().isBlank()) {
            metadata.setDescription(newMetadata.getDescription());
        }
        if (!metadata.getPageCountLocked() && newMetadata.getPageCount() != null) {
            metadata.setPageCount(newMetadata.getPageCount());
        }
        if (!metadata.getRatingLocked() && newMetadata.getRating() != null) {
            metadata.setRating(newMetadata.getRating());
        }
        if (!metadata.getReviewCountLocked() && newMetadata.getReviewCount() != null) {
            metadata.setReviewCount(newMetadata.getReviewCount());
        }
        if (!metadata.getSeriesNameLocked() && newMetadata.getSeriesName() != null) {
            metadata.setSeriesName(newMetadata.getSeriesName());
        }
        if (!metadata.getSeriesNumberLocked() && newMetadata.getSeriesNumber() != null) {
            metadata.setSeriesNumber(newMetadata.getSeriesNumber());
        }
        if (!metadata.getSeriesTotalLocked() && newMetadata.getSeriesTotal() != null) {
            metadata.setSeriesTotal(newMetadata.getSeriesTotal());
        }

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
            if (!newAwards.isEmpty()) {
                metadata.setAwards(new ArrayList<>(newAwards));
                bookAwardRepository.saveAll(newAwards);
            }
        }

        if (!metadata.getAuthorsLocked() && newMetadata.getAuthors() != null && !newMetadata.getAuthors().isEmpty()) {
            metadata.setAuthors(newMetadata.getAuthors().stream()
                    .map(authorName -> authorRepository.findByName(authorName)
                            .orElseGet(() -> authorRepository.save(AuthorEntity.builder().name(authorName).build())))
                    .collect(Collectors.toList()));
        }

        if (mergeCategories) {
            if (!metadata.getCategoriesLocked() && newMetadata.getCategories() != null) {
                HashSet<CategoryEntity> existingCategories = new HashSet<>(metadata.getCategories());
                newMetadata.getCategories().forEach(categoryName -> {
                    CategoryEntity categoryEntity = categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build()));
                    existingCategories.add(categoryEntity);
                });
                metadata.setCategories(new ArrayList<>(existingCategories));
            }
        } else {
            if (!metadata.getCategoriesLocked() && newMetadata.getCategories() != null && !newMetadata.getCategories().isEmpty()) {
                metadata.setCategories(newMetadata.getCategories().stream()
                        .map(categoryName -> categoryRepository.findByName(categoryName)
                                .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build())))
                        .collect(Collectors.toList()));
            }
        }

        if (setThumbnail && !metadata.getCoverLocked() && newMetadata.getThumbnailUrl() != null && !newMetadata.getThumbnailUrl().isEmpty()) {
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

        if (!metadata.getTitleLocked() && updatedMetadata.getTitle() != null) {
            metadata.setTitle(updatedMetadata.getTitle());
        }
        if (!metadata.getSubtitleLocked() && updatedMetadata.getSubtitle() != null) {
            metadata.setSubtitle(updatedMetadata.getSubtitle());
        }
        if (!metadata.getPublisherLocked() && updatedMetadata.getPublisher() != null) {
            metadata.setPublisher(updatedMetadata.getPublisher());
        }
        if (!metadata.getSeriesNameLocked() && updatedMetadata.getSeriesName() != null) {
            metadata.setSeriesName(updatedMetadata.getSeriesName());
        }
        if (!metadata.getSeriesNumberLocked() && updatedMetadata.getSeriesNumber() != null) {
            metadata.setSeriesNumber(updatedMetadata.getSeriesNumber());
        }
        if (!metadata.getSeriesTotalLocked() && updatedMetadata.getSeriesTotal() != null) {
            metadata.setSeriesTotal(updatedMetadata.getSeriesTotal());
        }
        if (!metadata.getPublishedDateLocked() && updatedMetadata.getPublishedDate() != null) {
            metadata.setPublishedDate(updatedMetadata.getPublishedDate());
        }
        if (!metadata.getDescriptionLocked() && updatedMetadata.getDescription() != null) {
            metadata.setDescription(updatedMetadata.getDescription());
        }
        if (!metadata.getIsbn13Locked() && updatedMetadata.getIsbn13() != null) {
            metadata.setIsbn13(updatedMetadata.getIsbn13());
        }
        if (!metadata.getIsbn10Locked() && updatedMetadata.getIsbn10() != null) {
            metadata.setIsbn10(updatedMetadata.getIsbn10());
        }
        if (!metadata.getPageCountLocked() && updatedMetadata.getPageCount() != null) {
            metadata.setPageCount(updatedMetadata.getPageCount());
        }
        if (!metadata.getLanguageLocked() && updatedMetadata.getLanguage() != null) {
            metadata.setLanguage(updatedMetadata.getLanguage());
        }
        if (!metadata.getRatingLocked() && updatedMetadata.getRating() != null) {
            metadata.setRating(updatedMetadata.getRating());
        }
        if (!metadata.getReviewCountLocked() && updatedMetadata.getReviewCount() != null) {
            metadata.setReviewCount(updatedMetadata.getReviewCount());
        }
        if (!metadata.getAuthorsLocked() && updatedMetadata.getAuthors() != null) {
            metadata.setAuthors(authorMapper.toAuthorEntityList(updatedMetadata.getAuthors()));
        }
        if (!metadata.getCategoriesLocked() && updatedMetadata.getCategories() != null) {
            metadata.setCategories(categoryMapper.toCategoryEntities(updatedMetadata.getCategories()));
        }

        bookRepository.save(bookEntity);
        return bookMetadataMapper.toBookMetadata(metadata, false);
    }
}