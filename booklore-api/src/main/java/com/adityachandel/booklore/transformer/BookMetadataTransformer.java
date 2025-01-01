package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.entity.Author;
import com.adityachandel.booklore.model.entity.BookMetadata;
import com.adityachandel.booklore.model.entity.Category;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.Comment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

public class BookMetadataTransformer {

    public static BookMetadataDTO convertToBookDTO(BookMetadata bookMetadata) {
        return BookMetadataDTO.builder()
                .bookId(bookMetadata.getBookId())
                .title(bookMetadata.getTitle())
                .description(bookMetadata.getDescription())
                .isbn10(bookMetadata.getIsbn10())
                .isbn13(bookMetadata.getIsbn13())
                .publisher(bookMetadata.getPublisher())
                .subtitle(bookMetadata.getSubtitle())
                .language(bookMetadata.getLanguage())
                .pageCount(bookMetadata.getPageCount())
                .publishedDate(bookMetadata.getPublishedDate())
                .authors(bookMetadata.getAuthors() == null ? null : bookMetadata.getAuthors().stream().map(AuthorTransformer::toAuthorDTO).collect(Collectors.toList()))
                .categories(bookMetadata.getCategories() == null ? null : bookMetadata.getCategories().stream().map(CategoryTransformer::categoryDTO).collect(Collectors.toList()))
                .build();
    }
}
