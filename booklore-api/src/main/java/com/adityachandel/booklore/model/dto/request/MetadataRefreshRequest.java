package com.adityachandel.booklore.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class MetadataRefreshRequest {
    @NotNull(message = "Refresh type cannot be null")
    private RefreshType refreshType;

    private Long libraryId;
    private Set<Long> bookIds;

    @NotNull(message = "Refresh options cannot be null")
    private MetadataRefreshOptions refreshOptions;

    public enum RefreshType {
        BOOKS, LIBRARY
    }
}
