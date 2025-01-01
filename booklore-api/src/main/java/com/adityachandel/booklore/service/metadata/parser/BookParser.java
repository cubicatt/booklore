package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.BookFetchQuery;

public interface BookParser {
    FetchedBookMetadata fetchMetadata(Long bookId, BookFetchQuery bookFetchQuery);
}
