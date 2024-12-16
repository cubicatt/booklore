package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.dto.response.GoogleBooksApiResponse;
import com.adityachandel.booklore.model.dto.response.GoogleBooksMetadata;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoogleBookMetadataService {

    private final ObjectMapper objectMapper;
    private static final String GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

    @SneakyThrows
    public List<GoogleBooksMetadata> queryByTerm(String term) {
        URI uri = UriComponentsBuilder.fromUriString(GOOGLE_BOOKS_API_URL).queryParam("q", term).build().toUri();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder().uri(uri).GET().build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        List<GoogleBooksMetadata> googleBooksMetadataList = new ArrayList<>();
        if (response.statusCode() == 200) {
            GoogleBooksApiResponse googleBooksApiResponse = objectMapper.readValue(response.body(), GoogleBooksApiResponse.class);
            if (googleBooksApiResponse != null && googleBooksApiResponse.getItems() != null) {
                for (GoogleBooksApiResponse.Item item : googleBooksApiResponse.getItems()) {
                    GoogleBooksMetadata googleBooksMetadata = handleItem(item);
                    googleBooksMetadataList.add(googleBooksMetadata);
                }
            }
        } else {
            System.out.println("Error: " + response.statusCode() + " - " + response.body());
        }
        return googleBooksMetadataList;
    }

    @SneakyThrows
    public GoogleBooksMetadata getByGoogleBookId(String googleBookId) {
        URI uri = UriComponentsBuilder.fromUriString(GOOGLE_BOOKS_API_URL + "/" + googleBookId)
                .build()
                .toUri();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            GoogleBooksApiResponse.Item item = objectMapper.readValue(response.body(), GoogleBooksApiResponse.Item.class);
            return handleItem(item);
        }
        return null;
    }

    private GoogleBooksMetadata handleItem(GoogleBooksApiResponse.Item item) {
        GoogleBooksApiResponse.Item.VolumeInfo volumeInfo = item.getVolumeInfo();
        GoogleBooksMetadata googleBooksMetadata = new GoogleBooksMetadata();
        googleBooksMetadata.setGoogleBookId(item.getId());
        googleBooksMetadata.setTitle(volumeInfo.getTitle());
        googleBooksMetadata.setSubtitle(volumeInfo.getSubtitle());
        googleBooksMetadata.setPublisher(volumeInfo.getPublisher());
        googleBooksMetadata.setPublishedDate(volumeInfo.getPublishedDate());
        googleBooksMetadata.setDescription(volumeInfo.getDescription());
        if (volumeInfo.getAuthors() != null && !volumeInfo.getAuthors().isEmpty()) {
            googleBooksMetadata.setAuthors(new ArrayList<>(volumeInfo.getAuthors()));
        }
        if (volumeInfo.getCategories() != null && !volumeInfo.getCategories().isEmpty()) {
            googleBooksMetadata.setCategories(new ArrayList<>(volumeInfo.getCategories()));
        }
        if (volumeInfo.getIndustryIdentifiers() != null) {
            for (GoogleBooksApiResponse.Item.IndustryIdentifier identifier : volumeInfo.getIndustryIdentifiers()) {
                if ("ISBN_13".equals(identifier.getType())) {
                    googleBooksMetadata.setIsbn13(identifier.getIdentifier());
                } else if ("ISBN_10".equals(identifier.getType())) {
                    googleBooksMetadata.setIsbn10(identifier.getIdentifier());
                }
            }
        }
        googleBooksMetadata.setPageCount(volumeInfo.getPageCount());
        googleBooksMetadata.setThumbnail(volumeInfo.getImageLinks() != null ? volumeInfo.getImageLinks().getThumbnail() : null);
        googleBooksMetadata.setLanguage(volumeInfo.getLanguage());
        return googleBooksMetadata;
    }
}
