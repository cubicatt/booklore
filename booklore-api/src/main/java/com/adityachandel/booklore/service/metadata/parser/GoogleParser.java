package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.response.GoogleBooksApiResponse;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import com.adityachandel.booklore.util.BookUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleParser implements BookParser {

    private final ObjectMapper objectMapper;
    private static final String GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

    @Override
    public FetchedBookMetadata fetchTopMetadata(Book book, FetchMetadataRequest fetchMetadataRequest) {
        List<FetchedBookMetadata> fetchedBookMetadata = fetchMetadata(book, fetchMetadataRequest);
        return fetchedBookMetadata.isEmpty() ? null : fetchedBookMetadata.getFirst();
    }

    @Override
    public List<FetchedBookMetadata> fetchMetadata(Book book, FetchMetadataRequest fetchMetadataRequest) {
        String searchTerm = getSearchTerm(book, fetchMetadataRequest);
        return searchTerm != null ? getMetadataListByTerm(searchTerm) : List.of();
    }

    public List<FetchedBookMetadata> getMetadataListByTerm(String term) {
        log.info("Google Books: Fetching metadata for: {}", term);
        try {
            URI uri = UriComponentsBuilder.fromUriString(GOOGLE_BOOKS_API_URL)
                    .queryParam("q", term)
                    .build()
                    .toUri();

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parseGoogleBooksApiResponse(response.body());
            } else {
                log.error("Failed to fetch metadata from Google Books API. Status: {}, Response: {}", response.statusCode(), response.body());
                return List.of();
            }
        } catch (IOException | InterruptedException e) {
            log.error("Error occurred while fetching metadata from Google Books API", e);
            return List.of();
        }
    }

    private List<FetchedBookMetadata> parseGoogleBooksApiResponse(String responseBody) throws IOException {
        GoogleBooksApiResponse googleBooksApiResponse = objectMapper.readValue(responseBody, GoogleBooksApiResponse.class);
        if (googleBooksApiResponse != null && googleBooksApiResponse.getItems() != null) {
            return googleBooksApiResponse.getItems().stream()
                    .map(this::convertToFetchedBookMetadata)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    private FetchedBookMetadata convertToFetchedBookMetadata(GoogleBooksApiResponse.Item item) {
        GoogleBooksApiResponse.Item.VolumeInfo volumeInfo = item.getVolumeInfo();
        Map<String, String> isbns = extractISBNs(volumeInfo.getIndustryIdentifiers());

        return FetchedBookMetadata.builder()
                .provider(MetadataProvider.Google)
                .providerBookId(item.getId())
                .title(volumeInfo.getTitle())
                .subtitle(volumeInfo.getSubtitle())
                .publisher(volumeInfo.getPublisher())
                .description(volumeInfo.getDescription())
                .authors(Optional.ofNullable(volumeInfo.getAuthors()).orElse(List.of()))
                .categories(Optional.ofNullable(volumeInfo.getCategories()).orElse(List.of()))
                .isbn13(isbns.get("ISBN_13"))
                .isbn10(isbns.get("ISBN_10"))
                .pageCount(volumeInfo.getPageCount())
                .thumbnailUrl(Optional.ofNullable(volumeInfo.getImageLinks())
                        .map(GoogleBooksApiResponse.Item.ImageLinks::getThumbnail)
                        .orElse(null))
                .language(volumeInfo.getLanguage())
                .build();
    }

    private Map<String, String> extractISBNs(List<GoogleBooksApiResponse.Item.IndustryIdentifier> identifiers) {
        if (identifiers == null) return Map.of();

        return identifiers.stream()
                .filter(identifier -> "ISBN_13".equals(identifier.getType()) || "ISBN_10".equals(identifier.getType()))
                .collect(Collectors.toMap(
                        GoogleBooksApiResponse.Item.IndustryIdentifier::getType,
                        GoogleBooksApiResponse.Item.IndustryIdentifier::getIdentifier,
                        (existing, replacement) -> existing
                ));
    }

    private String getSearchTerm(Book book, FetchMetadataRequest request) {
        String searchTerm = Optional.ofNullable(request.getTitle())
                .filter(title -> !title.isEmpty())
                .orElseGet(() -> Optional.ofNullable(book.getFileName())
                        .filter(fileName -> !fileName.isEmpty())
                        .map(BookUtils::cleanFileName)
                        .orElse(null));

        if (searchTerm != null) {
            searchTerm = searchTerm.replaceAll("[.,\\-\\[\\]{}()!@#$%^&*_=+|~`<>?/\";:]", "").trim();
            searchTerm = truncateToMaxLength(searchTerm, 60);
        }

        if (searchTerm != null && request.getAuthor() != null && !request.getAuthor().isEmpty()) {
            searchTerm += " " + request.getAuthor();
        }

        return searchTerm;
    }

    private String truncateToMaxLength(String input, int maxLength) {
        String[] words = input.split("\\s+");
        StringBuilder truncated = new StringBuilder();

        for (String word : words) {
            if (truncated.length() + word.length() + 1 > maxLength) break;
            if (!truncated.isEmpty()) truncated.append(" ");
            truncated.append(word);
        }

        return truncated.toString();
    }
}