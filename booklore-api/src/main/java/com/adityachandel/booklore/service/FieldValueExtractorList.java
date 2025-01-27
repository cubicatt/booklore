package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.dto.BookMetadata;

import java.util.List;

@FunctionalInterface
interface FieldValueExtractorList {
    List<String> extract(BookMetadata metadata);
}
