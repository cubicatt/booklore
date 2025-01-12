package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.request.BooksMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.LibraryMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshOptions;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.stomp.Topic;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.NotificationService;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.AmazonBookParser;
import com.adityachandel.booklore.service.metadata.parser.GoodReadsParser;
import com.adityachandel.booklore.service.metadata.parser.GoogleParser;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static com.adityachandel.booklore.model.stomp.LogNotification.createLogNotification;

@Slf4j
@Service
@AllArgsConstructor
public class BookMetadataService {

    private final GoogleParser googleParser;
    private final AmazonBookParser amazonBookParser;
    private final GoodReadsParser goodReadsParser;
    private final BookRepository bookRepository;
    private final LibraryRepository libraryRepository;
    private final BookMapper bookMapper;
    private final BookMetadataUpdater bookMetadataUpdater;
    private final NotificationService notificationService;

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
        if (provider == MetadataProvider.Amazon) {
            return amazonBookParser.fetchMetadata(book, request);
        } else if (provider == MetadataProvider.GoodReads) {
            return goodReadsParser.fetchMetadata(book, request);
        } else if (provider == MetadataProvider.Google) {
            return googleParser.fetchMetadata(book, request);
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
        if (provider == MetadataProvider.Amazon) {
            return amazonBookParser.fetchTopMetadata(book, fetchMetadataRequest);
        } else if (provider == MetadataProvider.GoodReads) {
            return goodReadsParser.fetchTopMetadata(book, fetchMetadataRequest);
        } else if (provider == MetadataProvider.Google) {
            return goodReadsParser.fetchTopMetadata(book, fetchMetadataRequest);
        } else {
            throw ApiError.METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST.createException();
        }
    }

    @Transactional
    public void refreshLibraryMetadata(LibraryMetadataRefreshRequest request) {
        LibraryEntity libraryEntity = libraryRepository.findById(request.getLibraryId()).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(request.getLibraryId()));
        List<BookEntity> books = libraryEntity.getBookEntities().stream()
                .sorted(Comparator.comparing(BookEntity::getFileName, Comparator.nullsLast(String::compareTo)))
                .toList();
        refreshBooksMetadata(books, request.getMetadataProvider(), request.isReplaceCover());
        log.info("Library Refresh Metadata task completed!");
    }

    @Transactional
    public void refreshBooksMetadata(BooksMetadataRefreshRequest request) {
        List<BookEntity> books = bookRepository.findAllByIdIn(request.getBookIds()).stream()
                .sorted(Comparator.comparing(BookEntity::getFileName, Comparator.nullsLast(String::compareTo)))
                .toList();
        refreshBooksMetadata(books, request.getMetadataProvider(), request.isReplaceCover());
        log.info("Books Refresh Metadata task completed!");
    }

    @Transactional
    public void refreshBooksMetadata(List<BookEntity> books, MetadataProvider metadataProvider, boolean replaceCover) {
        try {
            for (BookEntity bookEntity : books) {
                FetchedBookMetadata metadata = fetchTopMetadata(metadataProvider, bookMapper.toBook(bookEntity));
                if (metadata != null) {
                    updateBookMetadata(bookEntity, metadata, replaceCover);
                    if (metadataProvider == MetadataProvider.GoodReads) {
                        Thread.sleep(Duration.ofSeconds(ThreadLocalRandom.current().nextInt(3, 10)).toMillis());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error while parsing library books", e);
        }
    }


    @Transactional
    protected void updateBookMetadata(BookEntity bookEntity, FetchedBookMetadata metadata, boolean replaceCover) {
        if (metadata != null) {
            BookMetadataEntity bookMetadata = bookMetadataUpdater.setBookMetadata(bookEntity.getId(), metadata, replaceCover);
            bookEntity.setMetadata(bookMetadata);
            bookRepository.save(bookEntity);
            Book book = bookMapper.toBook(bookEntity);
            notificationService.sendMessage(Topic.METADATA_UPDATE, book);
            notificationService.sendMessage(Topic.LOG, createLogNotification("Book metadata updated: " + book.getMetadata().getTitle()));
        }
    }

    @Transactional
    public void refreshMetadataV2(MetadataRefreshRequest request) {
        log.info("Refresh Metadata V2 task started!");

        MetadataProvider defaultProvider = request.getRefreshOptions().getDefaultProvider();
        Set<MetadataProvider> nonDefaultProviders = getNonDefaultProviders(request);
        Set<MetadataProvider> allProviders = new HashSet<>(nonDefaultProviders);
        allProviders.add(defaultProvider);
        List<BookEntity> books = getBookEntities(request);

        for (BookEntity bookEntity : books) {
            try {
                Map<MetadataProvider, FetchedBookMetadata> metadataMap = allProviders.stream()
                        .map(provider -> CompletableFuture.supplyAsync(() -> fetchTopMetadata(provider, bookMapper.toBook(bookEntity)))
                                .exceptionally(e -> {
                                    log.error("Error fetching metadata from provider: {}", provider, e);
                                    return null;
                                }))
                        .map(CompletableFuture::join)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toMap(
                                FetchedBookMetadata::getProvider,
                                metadata -> metadata,
                                (existing, replacement) -> existing
                        ));

                FetchedBookMetadata combinedMetadata = setSpecificMetadata(request, metadataMap);
                nonDefaultProviders.forEach(provider -> setUnspecificMetadata(metadataMap, combinedMetadata, provider));
                setUnspecificMetadata(metadataMap, combinedMetadata, defaultProvider);
                if (allProviders.contains(MetadataProvider.GoodReads)) {
                    Thread.sleep(Duration.ofSeconds(ThreadLocalRandom.current().nextInt(2, 6)).toMillis());
                }
                updateBookMetadata(bookEntity, combinedMetadata, false);
            } catch (Exception e) {
                log.error("Error while updating book metadata, book: {}", bookEntity.getFileName(), e);
            }
        }
        log.info("Refresh Metadata V2 task completed!");
    }

    @Transactional
    protected FetchedBookMetadata setSpecificMetadata(MetadataRefreshRequest request, Map<MetadataProvider, FetchedBookMetadata> metadataMap) {
        FetchedBookMetadata metadataCombined = FetchedBookMetadata.builder().build();
        MetadataRefreshOptions.FieldOptions fieldOptions = request.getRefreshOptions().getFieldOptions();

        metadataCombined.setTitle(resolveFieldAsString(metadataMap, fieldOptions.getTitle(), FetchedBookMetadata::getTitle));
        metadataCombined.setDescription(resolveFieldAsString(metadataMap, fieldOptions.getDescription(), FetchedBookMetadata::getDescription));
        metadataCombined.setAuthors(resolveFieldAsList(metadataMap, fieldOptions.getAuthors(), FetchedBookMetadata::getAuthors));
        metadataCombined.setCategories(resolveFieldAsList(metadataMap, fieldOptions.getCategories(), FetchedBookMetadata::getCategories));
        metadataCombined.setThumbnailUrl(resolveFieldAsString(metadataMap, fieldOptions.getCover(), FetchedBookMetadata::getThumbnailUrl));
        return metadataCombined;
    }

    @Transactional
    protected void setUnspecificMetadata(Map<MetadataProvider, FetchedBookMetadata> metadataMap, FetchedBookMetadata metadataCombined, MetadataProvider provider) {
        if (metadataMap.containsKey(provider)) {
            FetchedBookMetadata metadata = metadataMap.get(provider);
            metadataCombined.setSubtitle(metadata.getSubtitle() != null ? metadata.getSubtitle() : metadata.getTitle());
            metadataCombined.setPublisher(metadata.getPublisher() != null ? metadata.getPublisher() : metadataCombined.getPublisher());
            metadataCombined.setPublishedDate(metadata.getPublishedDate() != null ? metadata.getPublishedDate() : metadataCombined.getPublishedDate());
            metadataCombined.setIsbn10(metadata.getIsbn10() != null ? metadata.getIsbn10() : metadataCombined.getIsbn10());
            metadataCombined.setIsbn13(metadata.getIsbn13() != null ? metadata.getIsbn13() : metadataCombined.getIsbn13());
            metadataCombined.setPageCount(metadata.getPageCount() != null ? metadata.getPageCount() : metadataCombined.getPageCount());
            metadataCombined.setLanguage(metadata.getLanguage() != null ? metadata.getLanguage() : metadataCombined.getLanguage());
            metadataCombined.setRating(metadata.getRating() != null ? metadata.getRating() : metadataCombined.getRating());
            metadataCombined.setRatingCount(metadata.getRatingCount() != null ? metadata.getRatingCount() : metadataCombined.getRatingCount());
            metadataCombined.setReviewCount(metadata.getReviewCount() != null ? metadata.getReviewCount() : metadataCombined.getReviewCount());
        }
    }

    @Transactional
    protected String resolveFieldAsString(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider, FieldValueExtractor fieldValueExtractor) {
        String value = null;
        if (fieldProvider.getDefaultProvider() != null && metadataMap.containsKey(fieldProvider.getDefaultProvider())) {
            value = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getDefaultProvider()));
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            value = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP2()));
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            value = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP1()));
        }
        return value;
    }

    @Transactional
    protected List<String> resolveFieldAsList(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider, FieldValueExtractorList fieldValueExtractor) {
        List<String> values = new ArrayList<>();
        if (fieldProvider.getDefaultProvider() != null && metadataMap.containsKey(fieldProvider.getDefaultProvider())) {
            values = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getDefaultProvider()));
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            values = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP2()));
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            values = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP1()));
        }
        return values;
    }

    /*@Transactional
    protected String resolveFieldAsString(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider) {
        if (fieldProvider.getDefaultProvider() != null && metadataMap.containsKey(fieldProvider.getDefaultProvider())) {
            return metadataMap.get(fieldProvider.getDefaultProvider()).getTitle();
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            return metadataMap.get(fieldProvider.getP2()).getTitle();
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            return metadataMap.get(fieldProvider.getP1()).getTitle();
        }
        return null;
    }

    @Transactional
    protected List<String> resolveFieldAsList(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider) {
        if (fieldProvider.getDefaultProvider() != null && metadataMap.containsKey(fieldProvider.getDefaultProvider())) {
            return metadataMap.get(fieldProvider.getDefaultProvider()).getAuthors();
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            return metadataMap.get(fieldProvider.getP2()).getAuthors();
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            return metadataMap.get(fieldProvider.getP1()).getAuthors();
        }
        return Collections.emptyList();
    }*/

    @Transactional
    protected List<BookEntity> getBookEntities(MetadataRefreshRequest request) {
        MetadataRefreshRequest.RefreshType refreshType = request.getRefreshType();
        List<BookEntity> books = new ArrayList<>();
        if (refreshType == MetadataRefreshRequest.RefreshType.LIBRARY) {
            LibraryEntity libraryEntity = libraryRepository.findById(request.getLibraryId()).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(request.getLibraryId()));
            books = libraryEntity.getBookEntities().stream()
                    .sorted(Comparator.comparing(BookEntity::getFileName, Comparator.nullsLast(String::compareTo)))
                    .toList();
        } else if (refreshType == MetadataRefreshRequest.RefreshType.BOOKS) {
            //TODO
        }
        return books;
    }

    @Transactional
    protected Set<MetadataProvider> getNonDefaultProviders(MetadataRefreshRequest request) {
        MetadataRefreshOptions.FieldOptions fieldOptions = request.getRefreshOptions().getFieldOptions();
        Set<MetadataProvider> uniqueProviders = new HashSet<>();

        if (fieldOptions != null) {
            addProviderToSet(fieldOptions.getTitle(), uniqueProviders);
            addProviderToSet(fieldOptions.getDescription(), uniqueProviders);
            addProviderToSet(fieldOptions.getAuthors(), uniqueProviders);
            addProviderToSet(fieldOptions.getCategories(), uniqueProviders);
            addProviderToSet(fieldOptions.getCover(), uniqueProviders);
        }

        return uniqueProviders;
    }

    @Transactional
    protected void addProviderToSet(MetadataRefreshOptions.FieldProvider fieldProvider, Set<MetadataProvider> providerSet) {
        if (fieldProvider != null) {
            if (fieldProvider.getDefaultProvider() != null) {
                providerSet.add(fieldProvider.getDefaultProvider());
            }
            if (fieldProvider.getP2() != null) {
                providerSet.add(fieldProvider.getP2());
            }
            if (fieldProvider.getP1() != null) {
                providerSet.add(fieldProvider.getP1());
            }
        }
    }
}