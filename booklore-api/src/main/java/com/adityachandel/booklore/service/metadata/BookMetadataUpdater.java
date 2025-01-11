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
    public BookMetadataEntity setBookMetadata(long bookId, FetchedBookMetadata newMetadata, MetadataProvider source, boolean setThumbnail) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookMetadataEntity metadata = bookEntity.getMetadata();
        metadata.setTitle(newMetadata.getTitle());
        metadata.setSubtitle(newMetadata.getSubtitle());
        metadata.setPublisher(newMetadata.getPublisher());
        metadata.setPublishedDate(newMetadata.getPublishedDate());
        metadata.setLanguage(newMetadata.getLanguage());
        metadata.setIsbn10(newMetadata.getIsbn10());
        metadata.setIsbn13(newMetadata.getIsbn13());
        metadata.setDescription(newMetadata.getDescription());
        metadata.setPageCount(newMetadata.getPageCount());
        metadata.setRating(newMetadata.getRating());
        metadata.setReviewCount(newMetadata.getReviewCount());
        if (newMetadata.getAuthors() != null && !newMetadata.getAuthors().isEmpty()) {
            List<AuthorEntity> authorEntities = newMetadata.getAuthors().stream()
                    .map(authorName -> authorRepository.findByName(authorName)
                            .orElseGet(() -> authorRepository.save(AuthorEntity.builder().name(authorName).build())))
                    .collect(Collectors.toList());
            metadata.setAuthors(authorEntities);
        }
        if (newMetadata.getCategories() != null && !newMetadata.getCategories().isEmpty()) {
            List<CategoryEntity> categories = new HashSet<>(newMetadata
                    .getCategories())
                    .stream()
                    .map(categoryName -> categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().name(categoryName).build())))
                    .collect(Collectors.toList());
            metadata.setCategories(categories);
        }

        if (setThumbnail) {
            if (newMetadata.getThumbnailUrl() != null && !newMetadata.getThumbnailUrl().isEmpty()) {
                String thumbnailPath = null;
                try {
                    thumbnailPath = fileService.createThumbnail(bookId, newMetadata.getThumbnailUrl(), source.name());
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
                metadata.setThumbnail(thumbnailPath);
            }
        }

        authorRepository.saveAll(metadata.getAuthors());
        categoryRepository.saveAll(metadata.getCategories());
        bookMetadataRepository.save(metadata);
        return metadata;
    }

}