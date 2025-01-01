package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.BookMetadataDTO;
import com.adityachandel.booklore.model.dto.CategoryDTO;
import com.adityachandel.booklore.model.entity.Author;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.BookMetadata;
import com.adityachandel.booklore.model.entity.Category;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookMetadataRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.CategoryRepository;
import com.adityachandel.booklore.service.metadata.model.BookFetchQuery;
import com.adityachandel.booklore.service.metadata.model.BookMetadataSource;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.parser.AmazonBookParser;
import com.adityachandel.booklore.transformer.BookMetadataTransformer;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class BookMetadataService {

    private AmazonBookParser amazonBookParser;
    private BookRepository bookRepository;
    private AuthorRepository authorRepository;
    private BookMetadataRepository bookMetadataRepository;
    private CategoryRepository categoryRepository;
    private FileService fileService;

    public FetchedBookMetadata fetchBookMetadata(long bookId, BookMetadataSource source, BookFetchQuery bookFetchQuery) {
        if (source == BookMetadataSource.AMAZON) {
            return amazonBookParser.fetchMetadata(bookId, bookFetchQuery);
        } else {
            throw ApiError.METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST.createException();
        }
    }

    public BookMetadataDTO setBookMetadata(long bookId, FetchedBookMetadata newMetadata, BookMetadataSource source) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        BookMetadata metadata = book.getMetadata();
        metadata.setTitle(newMetadata.getTitle());
        metadata.setSubtitle(newMetadata.getSubtitle());
        metadata.setPublisher(newMetadata.getPublisher());
        metadata.setPublishedDate(newMetadata.getPublishedDate());
        metadata.setLanguage(newMetadata.getLanguage());
        metadata.setIsbn10(newMetadata.getIsbn10());
        metadata.setIsbn13(newMetadata.getIsbn13());
        metadata.setDescription(newMetadata.getDescription());
        metadata.setPageCount(newMetadata.getPageCount());
        if (newMetadata.getAuthors() != null && !newMetadata.getAuthors().isEmpty()) {
            List<Author> authors = newMetadata.getAuthors().stream()
                    .map(authorName -> authorRepository.findByName(authorName)
                            .orElseGet(() -> authorRepository.save(Author.builder().name(authorName).build())))
                    .collect(Collectors.toList());
            metadata.setAuthors(authors);
        }
        if (newMetadata.getCategories() != null && !newMetadata.getCategories().isEmpty()) {
            List<Category> categories = new HashSet<>(newMetadata
                    .getCategories())
                    .stream()
                    .map(categoryName -> categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.save(Category.builder().name(categoryName).build())))
                    .collect(Collectors.toList());
            metadata.setCategories(categories);
        }

        if (newMetadata.getThumbnailUrl() != null && !newMetadata.getThumbnailUrl().isEmpty()) {
            String thumbnailPath = null;
            try {
                thumbnailPath = fileService.createThumbnail(bookId, newMetadata.getThumbnailUrl(), source.name());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            metadata.setThumbnail(thumbnailPath);
        }

        authorRepository.saveAll(metadata.getAuthors());
        categoryRepository.saveAll(metadata.getCategories());
        bookMetadataRepository.save(metadata);
        return BookMetadataTransformer.convertToBookDTO(metadata);
    }

}