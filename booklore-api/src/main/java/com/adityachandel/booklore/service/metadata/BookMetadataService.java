package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshOptions;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.websocket.Topic;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.NotificationService;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.BookParser;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static com.adityachandel.booklore.model.websocket.LogNotification.createLogNotification;
import static com.adityachandel.booklore.service.metadata.model.MetadataProvider.*;

@Slf4j
@Service
@AllArgsConstructor
public class BookMetadataService {

    private final BookRepository bookRepository;
    private final LibraryRepository libraryRepository;
    private final BookMapper bookMapper;
    private final BookMetadataUpdater bookMetadataUpdater;
    private final NotificationService notificationService;
    private final Map<MetadataProvider, BookParser> parserMap;


    public List<FetchedBookMetadata> fetchMetadataForRequest(long bookId, FetchMetadataRequest request) {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        Book book = bookMapper.toBook(bookEntity);
        List<List<FetchedBookMetadata>> allMetadata = request.getProviders().stream()
                .map(provider -> CompletableFuture.supplyAsync(() -> fetchMetadataListFromAProvider(provider, book, request))
                        .exceptionally(e -> {
                            log.error("Error fetching metadata from provider: {}", provider, e);
                            return List.of();
                        }))
                .toList()
                .stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .toList();

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

    public List<FetchedBookMetadata> fetchMetadataListFromAProvider(MetadataProvider provider, Book book, FetchMetadataRequest request) {
        return getParser(provider).fetchMetadata(book, request);
    }

    public FetchedBookMetadata fetchTopMetadataFromAProvider(MetadataProvider provider, Book book) {
        return getParser(provider).fetchTopMetadata(book, buildFetchMetadataRequestFromBook(book));
    }

    @Transactional
    public void refreshMetadata(MetadataRefreshRequest request) {
        log.info("Refresh Metadata task started!");
        List<MetadataProvider> providers = prepareProviders(request);
        List<BookEntity> books = getBookEntities(request);
        for (BookEntity bookEntity : books) {
            try {
                Map<MetadataProvider, FetchedBookMetadata> metadataMap = fetchMetadataForBook(providers, bookEntity);
                if (providers.contains(GoodReads)) {
                    Thread.sleep(Duration.ofSeconds(ThreadLocalRandom.current().nextInt(2, 6)).toMillis());
                }
                FetchedBookMetadata fetchedBookMetadata = getRawOrCombinedMetadata(request, metadataMap);
                updateBookMetadata(bookEntity, fetchedBookMetadata, shouldRefreshCovers(request));
            } catch (Exception e) {
                log.error("Error while updating book metadata, book: {}", bookEntity.getFileName(), e);
            }
        }
        log.info("Refresh Metadata task completed!");
    }

    @Transactional
    protected void updateBookMetadata(BookEntity bookEntity, FetchedBookMetadata metadata, boolean replaceCover) {
        if (metadata != null) {
            BookMetadataEntity bookMetadata = bookMetadataUpdater.setBookMetadata(bookEntity.getId(), metadata, replaceCover);
            bookEntity.setMetadata(bookMetadata);
            bookRepository.save(bookEntity);
            Book book = bookMapper.toBook(bookEntity);
            notificationService.sendMessage(Topic.BOOK_METADATA_UPDATE, book);
            notificationService.sendMessage(Topic.LOG, createLogNotification("Book metadata updated: " + book.getMetadata().getTitle()));
        }
    }

    @Transactional
    protected List<MetadataProvider> prepareProviders(MetadataRefreshRequest request) {
        if (request.getRefreshOptions().getFieldOptions() == null) {
            return List.of(request.getRefreshOptions().getDefaultProvider());
        } else {
            Set<MetadataProvider> allProviders = new HashSet<>(getNonDefaultProviders(request));
            allProviders.add(request.getRefreshOptions().getDefaultProvider());
            return new ArrayList<>(allProviders);
        }
    }

    @Transactional
    protected Map<MetadataProvider, FetchedBookMetadata> fetchMetadataForBook(List<MetadataProvider> providers, BookEntity bookEntity) {
        return providers.stream()
                .map(provider -> CompletableFuture.supplyAsync(() -> fetchTopMetadataFromAProvider(provider, bookMapper.toBook(bookEntity)))
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
    }

    @Transactional
    protected FetchedBookMetadata getRawOrCombinedMetadata(MetadataRefreshRequest request, Map<MetadataProvider, FetchedBookMetadata> metadataMap) {
        if (request.getRefreshOptions().getFieldOptions() == null) {
            return metadataMap.get(request.getRefreshOptions().getDefaultProvider());
        } else {
            MetadataProvider defaultProvider = request.getRefreshOptions().getDefaultProvider();
            Set<MetadataProvider> nonDefaultProviders = getNonDefaultProviders(request);
            FetchedBookMetadata combinedMetadata = setSpecificMetadata(request, metadataMap);

            nonDefaultProviders.forEach(provider -> setUnspecificMetadata(metadataMap, combinedMetadata, provider));
            setUnspecificMetadata(metadataMap, combinedMetadata, defaultProvider);

            return combinedMetadata;
        }
    }

    @Transactional
    protected boolean shouldRefreshCovers(MetadataRefreshRequest request) {
        return request.getRefreshOptions().isRefreshCovers();
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

    @Transactional
    protected List<BookEntity> getBookEntities(MetadataRefreshRequest request) {
        MetadataRefreshRequest.RefreshType refreshType = request.getRefreshType();
        if (refreshType != MetadataRefreshRequest.RefreshType.LIBRARY && refreshType != MetadataRefreshRequest.RefreshType.BOOKS) {
            throw ApiError.INVALID_REFRESH_TYPE.createException();
        }
        List<BookEntity> books = switch (refreshType) {
            case LIBRARY -> {
                LibraryEntity libraryEntity = libraryRepository.findById(request.getLibraryId()).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(request.getLibraryId()));
                yield libraryEntity.getBookEntities();
            }
            case BOOKS -> bookRepository.findAllByIdIn(request.getBookIds());
        };
        books.sort(Comparator.comparing(BookEntity::getFileName, Comparator.nullsLast(String::compareTo)));
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

    private FetchMetadataRequest buildFetchMetadataRequestFromBook(Book book) {
        return FetchMetadataRequest.builder()
                .isbn(book.getMetadata().getIsbn10())
                .author(book.getMetadata().getAuthors().stream()
                        .map(Author::getName)
                        .collect(Collectors.joining(", ")))
                .title(book.getMetadata().getTitle())
                .bookId(book.getId())
                .build();
    }

    private BookParser getParser(MetadataProvider provider) {
        BookParser parser = parserMap.get(provider);
        if (parser == null) {
            throw ApiError.METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST.createException();
        }
        return parser;
    }
}