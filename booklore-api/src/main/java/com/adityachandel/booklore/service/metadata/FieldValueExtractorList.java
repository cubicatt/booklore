package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;

import java.util.List;

@FunctionalInterface
interface FieldValueExtractorList {
    List<String> extract(FetchedBookMetadata metadata);
}
