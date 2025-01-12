package com.adityachandel.booklore.model.dto.request;

import lombok.Data;

import java.util.Set;

@Data
public class MetadataRefreshRequest {
    private RefreshType refreshType;
    private Long libraryId;
    private Set<Long> bookIds;
    private MetadataRefreshOptions refreshOptions;

    public enum RefreshType {
        BOOKS, LIBRARY
    }
}
