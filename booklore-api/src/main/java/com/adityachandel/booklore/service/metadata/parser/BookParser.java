package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;

import java.util.List;

public interface BookParser {
    List<FetchedBookMetadata> fetchMetadata(Long bookId, FetchMetadataRequest fetchMetadataRequest);
}
