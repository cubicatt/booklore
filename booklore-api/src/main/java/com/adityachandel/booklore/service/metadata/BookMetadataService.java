package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.AmazonBookParser;
import com.adityachandel.booklore.util.FileService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BookMetadataService {

    private AmazonBookParser amazonBookParser;
    private BookEntityRepository bookEntityRepository;
    private LibraryRepository libraryRepository;
    private AuthorRepository authorRepository;
    private BookMetadataRepository bookMetadataRepository;
    private CategoryRepository categoryRepository;
    private FileService fileService;
    private PlatformTransactionManager transactionManager;
    private BookMapper bookMapper;
    private BookMetadataMapper bookMetadataMapper;

    private final int GET_METADATA_COUNT = 5;


    public List<FetchedBookMetadata> fetchMetadataList(long bookId, FetchMetadataRequest request) {
        BookEntity bookEntity = bookEntityRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        Book book = bookMapper.toBook(bookEntity);
        if (request.getProvider() == MetadataProvider.AMAZON) {
            return amazonBookParser.fetchTopNMetadata(book, request, GET_METADATA_COUNT);
        } else {
            throw ApiError.METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST.createException();
        }
    }

    public FetchedBookMetadata fetchTopMetadata(MetadataProvider provider, Book book) {
        FetchMetadataRequest fetchMetadataRequest = FetchMetadataRequest.builder()
                .isbn(book.getMetadata().getIsbn10())
                .author(book.getMetadata().getAuthors().stream().map(Author::getName).collect(Collectors.joining(", ")))
                .title(book.getMetadata().getTitle())
                .bookId(book.getId())
                .build();
        if (provider == MetadataProvider.AMAZON) {
            return amazonBookParser.fetchTopMetadata(book, fetchMetadataRequest);
        } else {
            throw ApiError.METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST.createException();
        }
    }

    public void refreshMetadata(MetadataRefreshRequest request) {
        LibraryEntity libraryEntity = libraryRepository.findById(request.getLibraryId()).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(request.getLibraryId()));
        List<Book> books = libraryEntity.getBookEntities().stream().map(bookMapper::toBook).toList();
        Thread.startVirtualThread(() -> new TransactionTemplate(transactionManager).execute(status -> {
            try {
                for (Book book : books) {
                    FetchedBookMetadata metadata = fetchTopMetadata(request.getMetadataProvider(), book);
                    if (metadata != null) {
                        setBookMetadata(book.getId(), metadata, request.getMetadataProvider(), request.isReplaceCover());
                    }
                }
            } catch (Exception e) {
                log.error("Error while parsing library books", e);
            }
            log.info("Refresh Metadata task completed!");
            return null;
        }));
    }



    public BookMetadata setBookMetadata(long bookId, FetchedBookMetadata newMetadata, MetadataProvider source, boolean setThumbnail) {
        BookEntity bookEntity = bookEntityRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
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
                    throw new RuntimeException(e);
                }
                metadata.setThumbnail(thumbnailPath);
            }
        }

        authorRepository.saveAll(metadata.getAuthors());
        categoryRepository.saveAll(metadata.getCategories());
        bookMetadataRepository.save(metadata);
        return bookMetadataMapper.toBookMetadata(metadata, false);
    }

}