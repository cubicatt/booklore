package com.adityachandel.booklore.service.metadata;

import com.adityachandel.booklore.service.metadata.model.FetchedBookMetadata;

@FunctionalInterface
interface FieldValueExtractor {
    String extract(FetchedBookMetadata metadata);
}
