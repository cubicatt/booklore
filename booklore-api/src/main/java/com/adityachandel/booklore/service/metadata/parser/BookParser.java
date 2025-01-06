package com.adityachandel.booklore.service.metadata.parser;

import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dtonew.BookDTONew;
import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;
import com.adityachandel.booklore.service.metadata.model.FetchMetadataRequest;

import java.util.List;

public interface BookParser {

    List<FetchedBookMetadata> fetchTopNMetadata(Book book, FetchMetadataRequest fetchMetadataRequest, int n);

    FetchedBookMetadata fetchTopMetadata(Book book, FetchMetadataRequest fetchMetadataRequest);
}
