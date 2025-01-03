package com.adityachandel.booklore.service.metadata.model;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class FetchMetadataRequest {
    private Long bookId;
    private MetadataProvider provider;
    private String isbn;
    private String title;
    private String author;
}
