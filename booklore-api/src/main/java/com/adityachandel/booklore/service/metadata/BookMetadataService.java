package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.AmazonBookParser;
import com.adityachandel.booklore.service.metadata.parser.GoodReadsParser;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BookMetadataService {

    private AmazonBookParser amazonBookParser;
    private GoodReadsParser goodReadsParser;
    private BookRepository bookRepository;
    private LibraryRepository libraryRepository;
    private BookMapper bookMapper;
    private BookMetadataUpdater bookMetadataUpdater;


    public List<FetchedBookMetadata> fetchMetadataList(long bookId, FetchMetadataRequest request) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        Book book = bookMapper.toBook(bookEntity);

        List<CompletableFuture<List<FetchedBookMetadata>>> futures = request.getProviders().stream()
                .map(provider -> CompletableFuture.supplyAsync(() -> fetchMetadataFromProvider(provider, book, request))
                        .exceptionally(e -> {
                            log.error("Error fetching metadata from provider: {}", provider, e);
                            return List.of();
                        }))
                .toList();

        List<List<FetchedBookMetadata>> allMetadata = futures.stream().map(CompletableFuture::join).toList();

        List<FetchedBookMetadata> interleavedMetadata = new ArrayList<>();
        int maxSize = allMetadata.stream().mapToInt(List::size).max().orElse(0);

        for (int i = 0; i < maxSize; i++) {
            for (List<FetchedBookMetadata> metadataList : allMetadata) {
                if (i < metadataList.size()) {
                    interleavedMetadata.add(metadataList.get(i));
                }
            }
        }

        return interleavedMetadata;
    }

    private List<FetchedBookMetadata> fetchMetadataFromProvider(MetadataProvider provider, Book book, FetchMetadataRequest request) {
        if (provider == MetadataProvider.AMAZON) {
            return amazonBookParser.fetchMetadata(book, request);
        } else if (provider == MetadataProvider.GOOD_READS) {
            return goodReadsParser.fetchMetadata(book, request);
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

    @Transactional
    public void refreshMetadata(MetadataRefreshRequest request) {
        LibraryEntity libraryEntity = libraryRepository.findById(request.getLibraryId()).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(request.getLibraryId()));
        List<Book> books = libraryEntity.getBookEntities().stream().map(bookMapper::toBook).toList();
        try {
            for (Book book : books) {
                FetchedBookMetadata metadata = fetchTopMetadata(request.getMetadataProvider(), book);
                if (metadata != null) {
                    bookMetadataUpdater.setBookMetadata(book.getId(), metadata, request.getMetadataProvider(), request.isReplaceCover());
                }
            }
        } catch (Exception e) {
            log.error("Error while parsing library books", e);
        }
        log.info("Refresh Metadata task completed!");
    }

}