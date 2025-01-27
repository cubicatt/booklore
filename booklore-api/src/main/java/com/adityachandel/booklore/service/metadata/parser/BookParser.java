package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookMetadata;
import com.adityachandel.booklore.model.dto.request.FetchMetadataRequest;

import java.util.List;

public interface BookParser {

    List<BookMetadata> fetchMetadata(Book book, FetchMetadataRequest fetchMetadataRequest);

    BookMetadata fetchTopMetadata(Book book, FetchMetadataRequest fetchMetadataRequest);
}
