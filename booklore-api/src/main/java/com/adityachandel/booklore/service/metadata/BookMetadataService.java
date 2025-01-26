package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.BookMetadataMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshOptions;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.settings.AppSettings;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.websocket.Topic;
import com.adityachandel.booklore.repository.BookMetadataRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.AppSettingService;
import com.adityachandel.booklore.service.NotificationService;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.service.metadata.parser.BookParser;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final BookMetadataMapper bookMetadataMapper;
    private final BookMetadataUpdater bookMetadataUpdater;
    private final NotificationService notificationService;
    private final AppSettingService appSettingService;
    private final BookMetadataRepository bookMetadataRepository;
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

        if (request.getQuick() != null && request.getQuick()) {
            AppSettings appSettings = appSettingService.getAppSettings();
            request.setRefreshOptions(appSettings.getMetadataRefreshOptions());
        }

        List<MetadataProvider> providers = prepareProviders(request);
        List<BookEntity> books = getBookEntities(request);
        for (BookEntity bookEntity : books) {
            try {
                Boolean allFieldsLocked = bookEntity.getMetadata().getAllFieldsLocked();
                if (Boolean.TRUE.equals(allFieldsLocked)) {
                    log.info("Skipping metadata refresh for locked book: {}", bookEntity.getFileName());
                    continue;
                }
                Map<MetadataProvider, FetchedBookMetadata> metadataMap = fetchMetadataForBook(providers, bookEntity);
                if (providers.contains(GoodReads)) {
                    Thread.sleep(ThreadLocalRandom.current().nextLong(500, 1500));
                }
                FetchedBookMetadata fetchedBookMetadata = buildFetchMetadata(request, metadataMap);
                updateBookMetadata(bookEntity, fetchedBookMetadata, request.getRefreshOptions().isRefreshCovers(), request.getRefreshOptions().isMergeCategories());
            } catch (Exception e) {
                log.error("Error while updating book metadata, book: {}", bookEntity.getFileName(), e);
            }
        }
        log.info("Refresh Metadata task completed!");
    }

    @Transactional
    protected void updateBookMetadata(BookEntity bookEntity, FetchedBookMetadata metadata, boolean replaceCover, boolean mergeCategories) {
        if (metadata != null) {
            BookMetadataEntity bookMetadata = bookMetadataUpdater.setBookMetadata(bookEntity.getId(), metadata, replaceCover, mergeCategories);
            bookEntity.setMetadata(bookMetadata);
            bookRepository.save(bookEntity);
            Book book = bookMapper.toBook(bookEntity);
            notificationService.sendMessage(Topic.BOOK_METADATA_UPDATE, book);
            notificationService.sendMessage(Topic.LOG, createLogNotification("Book metadata updated: " + book.getMetadata().getTitle()));
        }
    }

    @Transactional
    protected List<MetadataProvider> prepareProviders(MetadataRefreshRequest request) {
        Set<MetadataProvider> allProviders = new HashSet<>(getAllProvidersUsingIndividualFields(request));
        return new ArrayList<>(allProviders);
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
    protected FetchedBookMetadata buildFetchMetadata(MetadataRefreshRequest request, Map<MetadataProvider, FetchedBookMetadata> metadataMap) {
        FetchedBookMetadata metadata = FetchedBookMetadata.builder().build();
        MetadataRefreshOptions.FieldOptions fieldOptions = request.getRefreshOptions().getFieldOptions();

        metadata.setTitle(resolveFieldAsString(metadataMap, fieldOptions.getTitle(), FetchedBookMetadata::getTitle));
        metadata.setDescription(resolveFieldAsString(metadataMap, fieldOptions.getDescription(), FetchedBookMetadata::getDescription));
        metadata.setAuthors(resolveFieldAsList(metadataMap, fieldOptions.getAuthors(), FetchedBookMetadata::getAuthors));
        if (request.getRefreshOptions().isMergeCategories()) {
            metadata.setCategories(getAllCategories(metadataMap, fieldOptions.getCategories(), FetchedBookMetadata::getCategories));
        } else {
            metadata.setCategories(resolveFieldAsList(metadataMap, fieldOptions.getCategories(), FetchedBookMetadata::getCategories));
        }
        metadata.setThumbnailUrl(resolveFieldAsString(metadataMap, fieldOptions.getCover(), FetchedBookMetadata::getThumbnailUrl));

        if (request.getRefreshOptions().getAllP3() != null) {
            setOtherUnspecifiedMetadata(metadataMap, metadata, request.getRefreshOptions().getAllP3());
        }
        if (request.getRefreshOptions().getAllP2() != null) {
            setOtherUnspecifiedMetadata(metadataMap, metadata, request.getRefreshOptions().getAllP2());
        }
        if (request.getRefreshOptions().getAllP1() != null) {
            setOtherUnspecifiedMetadata(metadataMap, metadata, request.getRefreshOptions().getAllP1());
        }

        return metadata;
    }

    @Transactional
    protected void setOtherUnspecifiedMetadata(Map<MetadataProvider, FetchedBookMetadata> metadataMap, FetchedBookMetadata metadataCombined, MetadataProvider provider) {
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
            metadataCombined.setAwards(metadata.getAwards() != null ? metadata.getAwards() : metadataCombined.getAwards());
            metadataCombined.setSeriesName(metadata.getSeriesName() != null ? metadata.getSeriesName() : metadataCombined.getSeriesName());
            metadataCombined.setSeriesNumber(metadata.getSeriesNumber() != null ? metadata.getSeriesNumber() : metadataCombined.getSeriesNumber());
            metadataCombined.setSeriesTotal(metadata.getSeriesTotal() != null ? metadata.getSeriesTotal() : metadataCombined.getSeriesTotal());
        }
    }

    @Transactional
    protected String resolveFieldAsString(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider, FieldValueExtractor fieldValueExtractor) {
        String value = null;
        if (fieldProvider.getP3() != null && metadataMap.containsKey(fieldProvider.getP3())) {
            String newValue = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP3()));
            if (newValue != null) {
                value = newValue;
            }
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            String newValue = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP2()));
            if (newValue != null) {
                value = newValue;
            }
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            String newValue = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP1()));
            if (newValue != null) {
                value = newValue;
            }
        }
        return value;
    }

    List<String> getAllCategories(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider, FieldValueExtractorList fieldValueExtractor) {
        Set<String> uniqueCategories = new HashSet<>();
        if (fieldProvider.getP3() != null && metadataMap.containsKey(fieldProvider.getP3())) {
            List<String> extracted = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP3()));
            if (extracted != null) {
                uniqueCategories.addAll(extracted);
            }
        }
        if (fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            List<String> extracted = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP2()));
            if (extracted != null) {
                uniqueCategories.addAll(extracted);
            }
        }
        if (fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            List<String> extracted = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP1()));
            if (extracted != null) {
                uniqueCategories.addAll(extracted);
            }
        }
        return new ArrayList<>(uniqueCategories);
    }

    @Transactional
    protected List<String> resolveFieldAsList(Map<MetadataProvider, FetchedBookMetadata> metadataMap, MetadataRefreshOptions.FieldProvider fieldProvider, FieldValueExtractorList fieldValueExtractor) {
        List<String> values = new ArrayList<>();
        if (fieldProvider.getP3() != null && metadataMap.containsKey(fieldProvider.getP3())) {
            List<String> newValues = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP3()));
            if (newValues != null && !newValues.isEmpty()) {
                values = newValues;
            }
        }
        if (values.isEmpty() && fieldProvider.getP2() != null && metadataMap.containsKey(fieldProvider.getP2())) {
            List<String> newValues = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP2()));
            if (newValues != null && !newValues.isEmpty()) {
                values = newValues;
            }
        }
        if (values.isEmpty() && fieldProvider.getP1() != null && metadataMap.containsKey(fieldProvider.getP1())) {
            List<String> newValues = fieldValueExtractor.extract(metadataMap.get(fieldProvider.getP1()));
            if (newValues != null && !newValues.isEmpty()) {
                values = newValues;
            }
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
    protected Set<MetadataProvider> getAllProvidersUsingIndividualFields(MetadataRefreshRequest request) {
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
            if (fieldProvider.getP3() != null) {
                providerSet.add(fieldProvider.getP3());
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

    public BookMetadata updateFieldLockState(long bookId, String field, boolean isLocked) {
        BookMetadataEntity existingMetadata = bookMetadataRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Book metadata not found"));
        switch (field) {
            case "title":
                existingMetadata.setTitleLocked(isLocked);
                break;
            case "subtitle":
                existingMetadata.setSubtitleLocked(isLocked);
                break;
            case "authors":
                existingMetadata.setAuthorsLocked(isLocked);
                break;
            case "categories":
                existingMetadata.setCategoriesLocked(isLocked);
                break;
            case "publisher":
                existingMetadata.setPublisherLocked(isLocked);
                break;
            case "publishedDate":
                existingMetadata.setPublishedDateLocked(isLocked);
                break;
            case "isbn10":
                existingMetadata.setIsbn10Locked(isLocked);
                break;
            case "isbn13":
                existingMetadata.setIsbn13Locked(isLocked);
                break;
            case "description":
                existingMetadata.setDescriptionLocked(isLocked);
                break;
            case "pageCount":
                existingMetadata.setPageCountLocked(isLocked);
                break;
            case "language":
                existingMetadata.setLanguageLocked(isLocked);
                break;
            case "rating":
                existingMetadata.setRatingLocked(isLocked);
                break;
            case "reviewCount":
                existingMetadata.setReviewCountLocked(isLocked);
                break;
            default:
                throw new IllegalArgumentException("Invalid field name: " + field);
        }
        return bookMetadataMapper.toBookMetadata(bookMetadataRepository.save(existingMetadata), true);
    }
}