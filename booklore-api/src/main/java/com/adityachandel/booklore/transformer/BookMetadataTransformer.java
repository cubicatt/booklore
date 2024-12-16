package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.entity.BookMetadata;

import java.util.stream.Collectors;

public class BookMetadataTransformer {

    public static BookMetadataDTO convertToBookDTO(BookMetadata bookMetadata) {
        return BookMetadataDTO.builder()
                .bookId(bookMetadata.getBookId())
                .googleBookId(bookMetadata.getGoogleBookId())
                .title(bookMetadata.getTitle())
                .description(bookMetadata.getDescription())
                .isbn10(bookMetadata.getIsbn10())
                .isbn13(bookMetadata.getIsbn13())
                .publisher(bookMetadata.getPublisher())
                .subtitle(bookMetadata.getSubtitle())
                .language(bookMetadata.getLanguage())
                .thumbnail(bookMetadata.getThumbnail())
                .pageCount(bookMetadata.getPageCount())
                .publishedDate(bookMetadata.getPublishedDate())
                .authors(bookMetadata.getAuthors() == null ? null : bookMetadata.getAuthors().stream().map(AuthorTransformer::toAuthorDTO).collect(Collectors.toList()))
                .categories(bookMetadata.getCategories() == null ? null : bookMetadata.getCategories().stream().map(CategoryTransformer::categoryDTO).collect(Collectors.toList()))
                .build();
    }
}
