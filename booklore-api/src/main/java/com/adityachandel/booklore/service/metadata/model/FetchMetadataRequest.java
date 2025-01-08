package com.adityachandel.booklore.service.metadata.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class FetchMetadataRequest {
    private Long bookId;
    private List<MetadataProvider> providers;
    private String isbn;
    private String title;
    private String author;
}
